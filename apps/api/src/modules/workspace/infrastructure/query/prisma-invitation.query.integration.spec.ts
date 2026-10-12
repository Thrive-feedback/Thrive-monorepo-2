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
    const owner = await fixtures.aSignedInAccount('invitation-query');
    const workspaceId = await fixtures.aWorkspace(owner);
    const now = new Date();
    const inDays = (days: number) => new Date(now.getTime() + days * DAY_MS);
    const send = (
      email: string,
      status: 'pending' | 'accepted' | 'canceled',
      expiresAt: Date,
    ) =>
      fixtures.anInvitation(workspaceId, owner, { email, status, expiresAt });
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
});

describe('reading one Invitation by its id', () => {
  it('answers each stored status as Thrive names it, with its Workspace and inviter', async () => {
    const owner = await fixtures.aSignedInAccount('invitation-by-id');
    const workspaceId = await fixtures.aWorkspace(owner, 'Acme');
    const now = new Date();
    const statusOf = async (
      status: 'pending' | 'accepted' | 'canceled' | 'rejected',
      expiresInDays: number,
    ) => {
      const id = await fixtures.anInvitation(workspaceId, owner, {
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
    const owner = await fixtures.aSignedInAccount('invitation-detail');
    const workspaceId = await fixtures.aWorkspace(owner, 'Acme');
    const id = await fixtures.anInvitation(workspaceId, owner, {
      email: 'somchai@acme.test',
      expiresAt: new Date(Date.now() + 7 * DAY_MS),
    });

    expect(await invitationQuery.invitationById(id, new Date())).toEqual({
      invitationId: id,
      workspace: { id: workspaceId, name: 'Acme' },
      inviterAccountId: owner.accountId,
      email: 'somchai@acme.test',
      status: 'PENDING',
    });
  });

  it('answers null for an id no Invitation has', async () => {
    expect(
      await invitationQuery.invitationById(uuidv7(), new Date()),
    ).toBeNull();
  });
});

describe('reading the Invitations Pending for one address', () => {
  it('answers them across Workspaces, newest first, with each Workspace and its Member count', async () => {
    const owner = await fixtures.aSignedInAccount('invitations-to-email');
    const teammate = await fixtures.aSignedInAccount('invitations-teammate');
    const acmeId = await fixtures.aWorkspace(owner, 'Acme');
    const otherOwner = await fixtures.aSignedInAccount('invitations-other');
    const globexId = await fixtures.aWorkspace(otherOwner, 'Globex');
    await fixtures.addMember(acmeId, teammate, 'member');
    const invitee = `invitee-${uuidv7()}@acme.test`;
    const now = new Date();
    const inDays = (days: number) => new Date(now.getTime() + days * DAY_MS);
    const toAcme = await fixtures.anInvitation(acmeId, owner, {
      email: invitee,
      createdAt: inDays(-2),
      expiresAt: inDays(5),
    });
    const toGlobex = await fixtures.anInvitation(globexId, otherOwner, {
      email: invitee,
      createdAt: inDays(-1),
      expiresAt: inDays(6),
    });

    const page = await invitationQuery.pendingInvitationsTo(
      InvitationRecipient.of(invitee),
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
    const owner = await fixtures.aSignedInAccount('invitations-closed');
    const workspaceId = await fixtures.aWorkspace(owner, 'Acme');
    const invitee = `invitee-${uuidv7()}@acme.test`;
    const now = new Date();
    const inDays = (days: number) => new Date(now.getTime() + days * DAY_MS);
    await fixtures.anInvitation(workspaceId, owner, {
      email: invitee,
      expiresAt: inDays(-1),
    });
    await fixtures.anInvitation(workspaceId, owner, {
      email: invitee,
      expiresAt: now,
    });
    await fixtures.anInvitation(workspaceId, owner, {
      email: invitee,
      status: 'canceled',
      expiresAt: inDays(7),
    });
    await fixtures.anInvitation(workspaceId, owner, {
      email: invitee,
      status: 'accepted',
      expiresAt: inDays(7),
    });
    await fixtures.anInvitation(workspaceId, owner, { expiresAt: inDays(7) });

    const page = await invitationQuery.pendingInvitationsTo(
      InvitationRecipient.of(invitee),
      now,
      { page: 1, pageSize: 20 },
    );

    expect(page).toEqual({ items: [], total: 0 });
  });
});
