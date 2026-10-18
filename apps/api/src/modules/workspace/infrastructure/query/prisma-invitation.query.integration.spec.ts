import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { WorkspaceFixtures } from '@test/support/workspace.integration-fixtures';
import { v7 as uuidv7 } from 'uuid';
import { InvitationRecipient } from '../../domain/value-object/invitation-recipient.vo';
import { PrismaInvitationQuery } from './prisma-invitation.query';

const DAY_MS = 24 * 60 * 60 * 1000;

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const invitationQuery = new PrismaInvitationQuery(
  new PrismaTransactionContext(prismaService),
);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

describe('reading the open Invitations of a Workspace', () => {
  it('answers pending ones and expired ones, and leaves out revoked and accepted ones', async () => {
    const admin = await fixtures.aSignedInAccount('invitation-query');
    const workspaceId = await fixtures.aWorkspace(admin);
    const now = new Date();
    const inDays = (days: number) => new Date(now.getTime() + days * DAY_MS);
    const send = (
      email: string,
      status: 'pending' | 'accepted' | 'canceled',
      expiresAt: Date,
    ) =>
      fixtures.anInvitation(workspaceId, admin, { email, status, expiresAt });
    await send('pending@acme.test', 'pending', inDays(7));
    await send('expired@acme.test', 'pending', inDays(-1));
    await send('canceled@acme.test', 'canceled', inDays(7));
    await send('accepted@acme.test', 'accepted', inDays(7));

    const page = await invitationQuery.openInvitationsOfWorkspace(
      workspaceId,
      now,
      { page: 1, pageSize: 20 },
    );

    expect(page.total).toBe(2);
    expect(page.items.map((i) => [i.email, i.status, i.role]).sort()).toEqual([
      ['expired@acme.test', 'EXPIRED', 'MEMBER'],
      ['pending@acme.test', 'PENDING', 'MEMBER'],
    ]);
  });

  it('answers when each was first sent and who sent it', async () => {
    const admin = await fixtures.aSignedInAccount('invitation-sender');
    const workspaceId = await fixtures.aWorkspace(admin);
    const sentAt = new Date(Date.now() - DAY_MS);
    await fixtures.anInvitation(workspaceId, admin, {
      createdAt: sentAt,
      lastSentAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * DAY_MS),
    });

    const page = await invitationQuery.openInvitationsOfWorkspace(
      workspaceId,
      new Date(),
      { page: 1, pageSize: 20 },
    );

    expect(page.items[0]).toMatchObject({
      invitedAt: sentAt,
      inviterAccountId: admin.accountId,
    });
  });
});

describe('reading one Invitation by its id', () => {
  it('answers each stored status as Thrive names it, with its Workspace and inviter', async () => {
    const admin = await fixtures.aSignedInAccount('invitation-by-id');
    const workspaceId = await fixtures.aWorkspace(admin, 'Acme');
    const now = new Date();
    const statusOf = async (
      status: 'pending' | 'accepted' | 'canceled' | 'rejected',
      expiresInDays: number,
    ) => {
      const id = await fixtures.anInvitation(workspaceId, admin, {
        status,
        expiresAt: new Date(now.getTime() + expiresInDays * DAY_MS),
      });
      return (await invitationQuery.invitationById(id, now))?.status;
    };

    expect(await statusOf('pending', 7)).toBe('PENDING');
    expect(await statusOf('pending', -1)).toBe('EXPIRED');
    expect(await statusOf('accepted', 7)).toBe('ACCEPTED');
    expect(await statusOf('canceled', 7)).toBe('REVOKED');
    expect(await statusOf('rejected', 7)).toBe('REVOKED');
  });

  it('answers the Workspace, the inviter and the address it was sent to', async () => {
    const admin = await fixtures.aSignedInAccount('invitation-detail');
    const workspaceId = await fixtures.aWorkspace(admin, 'Acme');
    const sentAt = new Date(Date.now() - DAY_MS);
    const id = await fixtures.anInvitation(workspaceId, admin, {
      email: 'somchai@acme.test',
      createdAt: sentAt,
      expiresAt: new Date(sentAt.getTime() + 7 * DAY_MS),
    });

    expect(await invitationQuery.invitationById(id, new Date())).toEqual({
      invitationId: id,
      workspace: { id: workspaceId, name: 'Acme' },
      inviterAccountId: admin.accountId,
      email: 'somchai@acme.test',
      role: 'MEMBER',
      status: 'PENDING',
      lastSentAt: sentAt,
    });
  });

  it('answers the last resend as when it was last sent', async () => {
    const admin = await fixtures.aSignedInAccount('invitation-resent');
    const workspaceId = await fixtures.aWorkspace(admin);
    const resentAt = new Date(Date.now() - 60_000);
    const id = await fixtures.anInvitation(workspaceId, admin, {
      createdAt: new Date(Date.now() - DAY_MS),
      lastSentAt: resentAt,
      expiresAt: new Date(Date.now() + 7 * DAY_MS),
    });

    expect(
      (await invitationQuery.invitationById(id, new Date()))?.lastSentAt,
    ).toEqual(resentAt);
  });

  it('answers null for an id no Invitation has', async () => {
    expect(
      await invitationQuery.invitationById(uuidv7(), new Date()),
    ).toBeNull();
  });
});

describe('reading the Invitations Pending for one address', () => {
  it('answers them across Workspaces, newest first, with each Workspace and its Member count', async () => {
    const admin = await fixtures.aSignedInAccount('invitations-to-email');
    const teammate = await fixtures.aSignedInAccount('invitations-teammate');
    const acmeId = await fixtures.aWorkspace(admin, 'Acme');
    const otherAdmin = await fixtures.aSignedInAccount('invitations-other');
    const globexId = await fixtures.aWorkspace(otherAdmin, 'Globex');
    await fixtures.addMember(acmeId, teammate, 'member');
    const invitee = `invitee-${uuidv7()}@acme.test`;
    const now = new Date();
    const inDays = (days: number) => new Date(now.getTime() + days * DAY_MS);
    const toAcme = await fixtures.anInvitation(acmeId, admin, {
      email: invitee,
      createdAt: inDays(-2),
      expiresAt: inDays(5),
    });
    const toGlobex = await fixtures.anInvitation(globexId, otherAdmin, {
      email: invitee,
      createdAt: inDays(-1),
      expiresAt: inDays(6),
    });

    const page = await invitationQuery.pendingInvitationsTo(
      InvitationRecipient.of(invitee),
      uuidv7(),
      now,
      { page: 1, pageSize: 20 },
    );

    expect(page.total).toBe(2);
    expect(
      page.items.map((i) => [
        i.invitationId,
        i.workspace.name,
        i.workspace.memberCount,
      ]),
    ).toEqual([
      [toGlobex, 'Globex', 1],
      [toAcme, 'Acme', 2],
    ]);
  });

  it('leaves out the ones expired, at their expiry or after, revoked, accepted, or sent to someone else', async () => {
    const admin = await fixtures.aSignedInAccount('invitations-closed');
    const workspaceId = await fixtures.aWorkspace(admin, 'Acme');
    const invitee = `invitee-${uuidv7()}@acme.test`;
    const now = new Date();
    const inDays = (days: number) => new Date(now.getTime() + days * DAY_MS);
    await fixtures.anInvitation(workspaceId, admin, {
      email: invitee,
      expiresAt: inDays(-1),
    });
    await fixtures.anInvitation(workspaceId, admin, {
      email: invitee,
      expiresAt: now,
    });
    await fixtures.anInvitation(workspaceId, admin, {
      email: invitee,
      status: 'canceled',
      expiresAt: inDays(7),
    });
    await fixtures.anInvitation(workspaceId, admin, {
      email: invitee,
      status: 'accepted',
      expiresAt: inDays(7),
    });
    await fixtures.anInvitation(workspaceId, admin, { expiresAt: inDays(7) });

    const page = await invitationQuery.pendingInvitationsTo(
      InvitationRecipient.of(invitee),
      uuidv7(),
      now,
      { page: 1, pageSize: 20 },
    );

    expect(page).toEqual({ items: [], total: 0 });
  });

  it('leaves out one to a Workspace the person is already active in', async () => {
    const admin = await fixtures.aSignedInAccount('invitations-already-in');
    const ben = await fixtures.aSignedInAccount('invitations-ben');
    const workspaceId = await fixtures.aWorkspace(admin, 'Acme');
    await fixtures.addMember(workspaceId, ben, 'member');
    const now = new Date();
    await fixtures.anInvitation(workspaceId, admin, {
      email: ben.email,
      expiresAt: new Date(now.getTime() + DAY_MS),
    });

    const page = await invitationQuery.pendingInvitationsTo(
      InvitationRecipient.of(ben.email),
      ben.accountId,
      now,
      { page: 1, pageSize: 20 },
    );

    expect(page).toEqual({ items: [], total: 0 });
  });
});
