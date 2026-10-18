import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import {
  type SignedInAccount,
  WorkspaceFixtures,
} from '@test/support/workspace.integration-fixtures';
import { PrismaMembershipQuery } from './prisma-membership.query';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const membershipQuery = new PrismaMembershipQuery(
  new PrismaTransactionContext(prismaService),
);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);
const PAGE = { page: 1, pageSize: 20 };

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

/** A Workspace with an active Admin, and an Admin and a Member who were Deactivated. */
async function aWorkspaceWithDeactivatedPeople() {
  const ann = await fixtures.aSignedInAccount('membership-ann');
  const workspaceId = await fixtures.aWorkspace(ann);
  const ben = await fixtures.aSignedInAccount('membership-ben');
  const cat = await fixtures.aSignedInAccount('membership-cat');
  await fixtures.addMember(workspaceId, ben, 'admin');
  await fixtures.addMember(workspaceId, cat, 'member');
  await deactivate(ben, workspaceId);
  await deactivate(cat, workspaceId);
  return { workspaceId, ann, ben, cat };
}

describe('reading memberships once some have been Deactivated', () => {
  it('answers no membership for a Deactivated person, in the Workspace or among theirs', async () => {
    const { workspaceId, cat } = await aWorkspaceWithDeactivatedPeople();

    expect(
      await membershipQuery.membershipInWorkspace(cat.accountId, workspaceId),
    ).toBe(null);
    expect(
      await membershipQuery.membershipsOfAccount(cat.accountId, PAGE, 'ACTIVE'),
    ).toEqual({ items: [], total: 0 });
  });

  it("lists a Deactivated person's Workspace among those they were Deactivated in", async () => {
    const { workspaceId, cat } = await aWorkspaceWithDeactivatedPeople();

    const deactivated = await membershipQuery.membershipsOfAccount(
      cat.accountId,
      PAGE,
      'DEACTIVATED',
    );

    expect(deactivated.items.map((m) => m.workspace.id)).toEqual([workspaceId]);
  });

  it('leaves Deactivated people out of those who can be named in a request', async () => {
    const { workspaceId, ann, ben, cat } =
      await aWorkspaceWithDeactivatedPeople();

    expect(
      await membershipQuery.membersAmong(workspaceId, [
        ann.accountId,
        ben.accountId,
        cat.accountId,
      ]),
    ).toEqual([ann.accountId]);
  });

  it('says which of the people named are Deactivated, leaving out the active', async () => {
    const { workspaceId, ann, ben, cat } =
      await aWorkspaceWithDeactivatedPeople();

    const deactivated = await membershipQuery.deactivatedAmong(workspaceId, [
      ann.accountId,
      ben.accountId,
      cat.accountId,
    ]);

    expect([...deactivated].sort()).toEqual(
      [ben.accountId, cat.accountId].sort(),
    );
  });

  it('counts only active Admins', async () => {
    const { workspaceId } = await aWorkspaceWithDeactivatedPeople();

    expect(await membershipQuery.adminCountOf(workspaceId)).toBe(1);
  });

  it('lists active and Deactivated Members apart', async () => {
    const { workspaceId, ann, ben, cat } =
      await aWorkspaceWithDeactivatedPeople();

    expect(
      await membershipQuery.membersOfWorkspace(workspaceId, PAGE, 'ACTIVE'),
    ).toEqual({
      items: [{ accountId: ann.accountId, role: 'ADMIN' }],
      total: 1,
    });
    expect(
      await membershipQuery.membersOfWorkspace(
        workspaceId,
        PAGE,
        'DEACTIVATED',
      ),
    ).toEqual({
      items: [
        { accountId: ben.accountId, role: 'ADMIN' },
        { accountId: cat.accountId, role: 'MEMBER' },
      ],
      total: 2,
    });
  });

  it('says who was Deactivated there, and nobody else', async () => {
    const { workspaceId, ann, cat } = await aWorkspaceWithDeactivatedPeople();
    const stranger = await fixtures.aSignedInAccount('membership-stranger');

    expect(
      await membershipQuery.isDeactivatedIn(cat.accountId, workspaceId),
    ).toBe(true);
    expect(
      await membershipQuery.isDeactivatedIn(ann.accountId, workspaceId),
    ).toBe(false);
    expect(
      await membershipQuery.isDeactivatedIn(stranger.accountId, workspaceId),
    ).toBe(false);
  });
});

describe('reading which Workspace someone is in', () => {
  async function usedAt(
    account: SignedInAccount,
    workspaceId: string,
    lastUsedAt: Date,
  ) {
    await prismaService.member.update({
      where: { workspaceId_userId: { workspaceId, userId: account.accountId } },
      data: { lastUsedAt },
    });
  }

  async function workspacesOf(account: SignedInAccount) {
    const page = await membershipQuery.membershipsOfAccount(
      account.accountId,
      PAGE,
      'ACTIVE',
    );
    return page.items.map((m) => m.workspace.name);
  }

  it('answers the one used last first, then those never used, newest joined first', async () => {
    const ann = await fixtures.aSignedInAccount('current-ann');
    const first = await fixtures.aWorkspace(ann, 'First');
    await fixtures.aWorkspace(ann, 'Second');
    const third = await fixtures.aWorkspace(ann, 'Third');
    await usedAt(ann, first, new Date('2026-10-01T00:00:00Z'));
    await usedAt(ann, third, new Date('2026-10-02T00:00:00Z'));

    expect(await workspacesOf(ann)).toEqual(['Third', 'First', 'Second']);
  });

  it('falls back to the active one used most recently once the last used is Deactivated', async () => {
    const ann = await fixtures.aSignedInAccount('fallback-ann');
    const older = await fixtures.aWorkspace(ann, 'Older');
    const newer = await fixtures.aWorkspace(ann, 'Newer');
    await usedAt(ann, older, new Date('2026-10-01T00:00:00Z'));
    await usedAt(ann, newer, new Date('2026-10-02T00:00:00Z'));

    await deactivate(ann, newer);

    expect(await workspacesOf(ann)).toEqual(['Older']);
  });
});
