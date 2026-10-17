import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { PrismaUnitOfWork } from '@app/infrastructure/database/prisma-unit-of-work.adapter';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { FakeClock } from '@test/support/clock.fake';
import {
  type SignedInAccount,
  WorkspaceFixtures,
} from '@test/support/workspace.integration-fixtures';
import { LastAdminError } from '../../domain/workspace.errors';
import { PrismaMemberDeactivatingAdapter } from '../../infrastructure/adapter/prisma-member-deactivating.adapter';
import { PrismaMembershipQuery } from '../../infrastructure/query/prisma-membership.query';
import { NotAllowedToDeactivateError } from '../workspace.errors';
import { DeactivateMemberUseCase } from './deactivate-member.use-case';
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
const deactivateMemberUseCase = new DeactivateMemberUseCase(
  new PrismaMemberDeactivatingAdapter(prismaTransactionContext),
  membershipQuery,
  new PrismaUnitOfWork(prismaService, prismaTransactionContext),
  new FakeClock(new Date()),
);
const resolveMembershipUseCase = new ResolveMembershipUseCase(membershipQuery);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

/** Resolves `deactivator`'s membership the way the route's guard does, ready to Deactivate. */
async function asDeactivator(
  deactivator: SignedInAccount,
  workspaceId: string,
) {
  const membership = await resolveMembershipUseCase.execute({
    accountId: deactivator.accountId,
    workspaceId,
  });
  return (account: SignedInAccount) =>
    deactivateMemberUseCase.execute({
      deactivatorAccountId: deactivator.accountId,
      membership,
      accountId: account.accountId,
    });
}

async function storedMember(account: SignedInAccount, workspaceId: string) {
  return prismaService.member.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: account.accountId } },
    select: { role: true, deactivatedAt: true },
  });
}

describe('Deactivating in a real Workspace', () => {
  it('keeps the membership and its Role, and ends access', async () => {
    const ann = await fixtures.aSignedInAccount('deactivate-ann');
    const workspaceId = await fixtures.aWorkspace(ann);
    const ben = await fixtures.aSignedInAccount('deactivate-ben');
    await fixtures.addMember(workspaceId, ben, 'member');

    await (await asDeactivator(ann, workspaceId))(ben);

    const stored = await storedMember(ben, workspaceId);
    expect(stored?.role).toBe('member');
    expect(stored?.deactivatedAt).toBeInstanceOf(Date);
    await expect(
      resolveMembershipUseCase.execute({
        accountId: ben.accountId,
        workspaceId,
      }),
    ).rejects.toThrow();
  });

  it('lets a Member leave, and refuses them Deactivating anyone else', async () => {
    const ann = await fixtures.aSignedInAccount('deactivate-leave-ann');
    const workspaceId = await fixtures.aWorkspace(ann);
    const ben = await fixtures.aSignedInAccount('deactivate-leave-ben');
    await fixtures.addMember(workspaceId, ben, 'member');
    const asBen = await asDeactivator(ben, workspaceId);

    await expect(asBen(ann)).rejects.toThrow(NotAllowedToDeactivateError);
    await asBen(ben);

    expect(
      (await storedMember(ben, workspaceId))?.deactivatedAt,
    ).toBeInstanceOf(Date);
    expect((await storedMember(ann, workspaceId))?.deactivatedAt).toBe(null);
  });

  it('refuses the only Admin leaving', async () => {
    const ann = await fixtures.aSignedInAccount('deactivate-only-admin');
    const workspaceId = await fixtures.aWorkspace(ann);

    await expect((await asDeactivator(ann, workspaceId))(ann)).rejects.toThrow(
      LastAdminError,
    );
    expect((await storedMember(ann, workspaceId))?.deactivatedAt).toBe(null);
  });
});

describe('two Admins Deactivating each other at once', () => {
  it('lets one through and refuses the other, so an active Admin remains', async () => {
    const ann = await fixtures.aSignedInAccount('deactivate-race-ann');
    const workspaceId = await fixtures.aWorkspace(ann);
    const ben = await fixtures.aSignedInAccount('deactivate-race-ben');
    await fixtures.addMember(workspaceId, ben, 'admin');

    // Both pass the route's guard as active Admins before either Deactivation lands.
    const [asAnn, asBen] = await Promise.all([
      asDeactivator(ann, workspaceId),
      asDeactivator(ben, workspaceId),
    ]);
    const results = await Promise.allSettled([asAnn(ben), asBen(ann)]);

    expect(results.map((r) => r.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(await membershipQuery.adminCountOf(workspaceId)).toBe(1);
  });
});
