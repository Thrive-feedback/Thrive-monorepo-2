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
import { LastAdminError } from '../../domain/workspace.errors';
import { BetterAuthMemberRoleChangingAdapter } from '../../infrastructure/adapter/better-auth-member-role-changing.adapter';
import { PrismaMembershipQuery } from '../../infrastructure/query/prisma-membership.query';
import { NotAllowedToChangeRolesError } from '../workspace.errors';
import { ChangeMemberRoleUseCase } from './change-member-role.use-case';
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
const changeMemberRoleUseCase = new ChangeMemberRoleUseCase(
  new BetterAuthMemberRoleChangingAdapter(auth),
  membershipQuery,
  new PrismaUnitOfWork(prismaService, prismaTransactionContext),
);
const resolveMembershipUseCase = new ResolveMembershipUseCase(membershipQuery);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

/** Resolves `changer`'s membership the way the route's guard does, ready to change a Role. */
async function asChanger(changer: SignedInAccount, workspaceId: string) {
  const membership = await resolveMembershipUseCase.execute({
    accountId: changer.accountId,
    workspaceId,
  });
  return (account: SignedInAccount, role: 'ADMIN' | 'MEMBER') =>
    changeMemberRoleUseCase.execute({
      credential: changer.credential,
      changerAccountId: changer.accountId,
      membership,
      accountId: account.accountId,
      role,
    });
}

async function changeAs(
  changer: SignedInAccount,
  workspaceId: string,
  account: SignedInAccount,
  role: 'ADMIN' | 'MEMBER',
) {
  await (await asChanger(changer, workspaceId))(account, role);
}

async function roleOf(account: SignedInAccount, workspaceId: string) {
  return (
    await membershipQuery.membershipInWorkspace(account.accountId, workspaceId)
  )?.role;
}

describe('changing Roles in a real Workspace', () => {
  it('makes a Member an Admin, and back again', async () => {
    const founder = await fixtures.aSignedInAccount('roles-founder');
    const workspaceId = await fixtures.aWorkspace(founder);
    const ben = await fixtures.aSignedInAccount('roles-ben');
    await fixtures.addMember(workspaceId, ben, 'member');

    await changeAs(founder, workspaceId, ben, 'ADMIN');
    expect(await roleOf(ben, workspaceId)).toBe('ADMIN');

    await changeAs(founder, workspaceId, ben, 'MEMBER');
    expect(await roleOf(ben, workspaceId)).toBe('MEMBER');
  });

  it('lets an Admin make the founder a Member', async () => {
    const founder = await fixtures.aSignedInAccount('roles-demoted-founder');
    const workspaceId = await fixtures.aWorkspace(founder);
    const ben = await fixtures.aSignedInAccount('roles-other-admin');
    await fixtures.addMember(workspaceId, ben, 'admin');

    await changeAs(ben, workspaceId, founder, 'MEMBER');

    expect(await roleOf(founder, workspaceId)).toBe('MEMBER');
  });

  it('refuses a Member with no management rights', async () => {
    const founder = await fixtures.aSignedInAccount('roles-refused-founder');
    const workspaceId = await fixtures.aWorkspace(founder);
    const ben = await fixtures.aSignedInAccount('roles-refused-member');
    await fixtures.addMember(workspaceId, ben, 'member');

    await expect(changeAs(ben, workspaceId, ben, 'ADMIN')).rejects.toThrow(
      NotAllowedToChangeRolesError,
    );
    expect(await roleOf(ben, workspaceId)).toBe('MEMBER');
  });

  it('refuses to make the only Admin a Member', async () => {
    const founder = await fixtures.aSignedInAccount('roles-only-admin');
    const workspaceId = await fixtures.aWorkspace(founder);

    await expect(
      changeAs(founder, workspaceId, founder, 'MEMBER'),
    ).rejects.toThrow(LastAdminError);
    expect(await roleOf(founder, workspaceId)).toBe('ADMIN');
  });
});

describe('two Admins making each other Members at once', () => {
  it('lets one through and refuses the other, so an Admin remains', async () => {
    const ann = await fixtures.aSignedInAccount('roles-race-ann');
    const workspaceId = await fixtures.aWorkspace(ann);
    const ben = await fixtures.aSignedInAccount('roles-race-ben');
    await fixtures.addMember(workspaceId, ben, 'admin');

    // Both pass the route's guard as Admins before either change lands.
    const [asAnn, asBen] = await Promise.all([
      asChanger(ann, workspaceId),
      asChanger(ben, workspaceId),
    ]);
    const results = await Promise.allSettled([
      asAnn(ben, 'MEMBER'),
      asBen(ann, 'MEMBER'),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    // The loser was made a Member first, so it is refused as no longer an Admin.
    expect(results.find((r) => r.status === 'rejected')?.reason).toBeInstanceOf(
      NotAllowedToChangeRolesError,
    );
    expect(await membershipQuery.adminCountOf(workspaceId)).toBe(1);
  });
});
