import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { PrismaUnitOfWork } from '@app/infrastructure/database/prisma-unit-of-work.adapter';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import {
  type SignedInAccount,
  WorkspaceFixtures,
} from '@test/support/workspace.integration-fixtures';
import { PrismaMemberReactivatingAdapter } from '../../infrastructure/adapter/prisma-member-reactivating.adapter';
import { PrismaMembershipQuery } from '../../infrastructure/query/prisma-membership.query';
import { NotAllowedToReactivateError } from '../workspace.errors';
import { ReactivateMemberUseCase } from './reactivate-member.use-case';
import { ResolveMembershipUseCase } from './resolve-membership.use-case';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const prismaTransactionContext = new PrismaTransactionContext(prismaService);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const membershipQuery = new PrismaMembershipQuery(prismaTransactionContext);
const reactivateMemberUseCase = new ReactivateMemberUseCase(
  new PrismaMemberReactivatingAdapter(prismaTransactionContext),
  membershipQuery,
  new PrismaUnitOfWork(prismaService, prismaTransactionContext),
);
const resolveMembershipUseCase = new ResolveMembershipUseCase(membershipQuery);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

async function deactivate(account: SignedInAccount, workspaceId: string) {
  await prismaService.member.update({
    where: { workspaceId_userId: { workspaceId, userId: account.accountId } },
    data: { deactivatedAt: new Date() },
  });
}

/** Resolves `reactivator`'s membership the way the route's guard does, ready to Reactivate. */
async function asReactivator(
  reactivator: SignedInAccount,
  workspaceId: string,
) {
  const membership = await resolveMembershipUseCase.execute({
    accountId: reactivator.accountId,
    workspaceId,
  });
  return (account: SignedInAccount) =>
    reactivateMemberUseCase.execute({
      reactivatorAccountId: reactivator.accountId,
      membership,
      accountId: account.accountId,
    });
}

describe('Reactivating in a real Workspace', () => {
  it('gives a former Admin their access back, as an Admin', async () => {
    const ann = await fixtures.aSignedInAccount('reactivate-ann');
    const workspaceId = await fixtures.aWorkspace(ann);
    const ben = await fixtures.aSignedInAccount('reactivate-ben');
    await fixtures.addMember(workspaceId, ben, 'admin');
    await deactivate(ben, workspaceId);

    await (await asReactivator(ann, workspaceId))(ben);

    expect(
      await resolveMembershipUseCase.execute({
        accountId: ben.accountId,
        workspaceId,
      }),
    ).toMatchObject({ role: 'ADMIN' });
    expect(await membershipQuery.adminCountOf(workspaceId)).toBe(2);
  });

  it('refuses a Member, and leaves the person Deactivated', async () => {
    const ann = await fixtures.aSignedInAccount('reactivate-refused-ann');
    const workspaceId = await fixtures.aWorkspace(ann);
    const ben = await fixtures.aSignedInAccount('reactivate-refused-ben');
    const cat = await fixtures.aSignedInAccount('reactivate-refused-cat');
    await fixtures.addMember(workspaceId, ben, 'member');
    await fixtures.addMember(workspaceId, cat, 'member');
    await deactivate(cat, workspaceId);

    await expect((await asReactivator(ben, workspaceId))(cat)).rejects.toThrow(
      NotAllowedToReactivateError,
    );
    expect(
      await membershipQuery.isDeactivatedIn(cat.accountId, workspaceId),
    ).toBe(true);
  });
});
