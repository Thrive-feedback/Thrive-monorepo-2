import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { WorkspaceFixtures } from '@test/support/workspace.integration-fixtures';
import type {
  InvitationReissued,
  InvitationStored,
} from '../../application/port/workspace-inviting.port';
import { BetterAuthWorkspaceInvitingAdapter } from './better-auth-workspace-inviting.adapter';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const workspaceInviting = new BetterAuthWorkspaceInvitingAdapter(auth);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

/** The stored Invitation, or a failed test when the address was not invited. */
function invited(stored: InvitationStored) {
  if (stored.outcome !== 'invited') {
    throw new Error(`Expected an Invitation, got ${stored.outcome}.`);
  }
  return stored;
}

/** What a reissue left Pending, or a failed test when the address had joined. */
function reissuedOf(reissued: InvitationReissued) {
  if (reissued.outcome !== 'reissued') {
    throw new Error(`Expected a Pending Invitation, got ${reissued.outcome}.`);
  }
  return reissued;
}

async function anOwnerWithAWorkspace() {
  const owner = await fixtures.aSignedInAccount('inviting-owner');
  return { owner, workspaceId: await fixtures.aWorkspace(owner) };
}

describe('storing Invitations through the organization plugin', () => {
  it('stores a Pending Invitation for the Member role, expiring in 7 days', async () => {
    const { owner, workspaceId } = await anOwnerWithAWorkspace();
    const before = Date.now();

    const stored = invited(
      await workspaceInviting.invite({
        credential: owner.credential,
        workspaceId,
        email: 'ben@acme.test',
      }),
    );

    const row = await prismaService.invitation.findUniqueOrThrow({
      where: { id: stored.invitationId },
    });
    expect(row).toMatchObject({
      workspaceId,
      email: 'ben@acme.test',
      role: 'member',
      status: 'pending',
      inviterId: owner.accountId,
    });
    expect(stored.expiresAt.getTime() - before).toBeGreaterThanOrEqual(
      SEVEN_DAYS_MS - 1000,
    );
    expect(stored.expiresAt.getTime() - before).toBeLessThanOrEqual(
      SEVEN_DAYS_MS + 60_000,
    );
  });

  it('answers already invited for an address with a Pending Invitation', async () => {
    const { owner, workspaceId } = await anOwnerWithAWorkspace();
    const request = {
      credential: owner.credential,
      workspaceId,
      email: 'ben@acme.test',
    };
    await workspaceInviting.invite(request);

    expect(await workspaceInviting.invite(request)).toEqual({
      outcome: 'already_invited',
    });
  });

  it('answers already a Member for the address of someone in the Workspace', async () => {
    const { owner, workspaceId } = await anOwnerWithAWorkspace();
    const member = await fixtures.aSignedInAccount('inviting-member');
    await fixtures.addMember(workspaceId, member, 'member');

    expect(
      await workspaceInviting.invite({
        credential: owner.credential,
        workspaceId,
        email: member.email,
      }),
    ).toEqual({ outcome: 'already_member' });
  });

  it('revokes an Invitation, after which the address can be invited again', async () => {
    const { owner, workspaceId } = await anOwnerWithAWorkspace();
    const request = {
      credential: owner.credential,
      workspaceId,
      email: 'ben@acme.test',
    };
    const first = invited(await workspaceInviting.invite(request));

    await workspaceInviting.revoke({
      credential: owner.credential,
      invitationId: first.invitationId,
    });

    expect(
      await prismaService.invitation.findUniqueOrThrow({
        where: { id: first.invitationId },
      }),
    ).toMatchObject({ status: 'canceled' });
    expect((await workspaceInviting.invite(request)).outcome).toBe('invited');
  });
});

describe('accepting an Invitation through the organization plugin', () => {
  async function anInvitationFor(email: string) {
    const { owner, workspaceId } = await anOwnerWithAWorkspace();
    const stored = invited(
      await workspaceInviting.invite({
        credential: owner.credential,
        workspaceId,
        email,
      }),
    );
    return { workspaceId, invitationId: stored.invitationId };
  }

  it('makes the invited person a Member with the Member role, and settles the Invitation', async () => {
    const invitee = await fixtures.aSignedInAccount('accepting-invitee');
    const { workspaceId, invitationId } = await anInvitationFor(invitee.email);

    await workspaceInviting.accept({
      credential: invitee.credential,
      invitationId,
    });

    expect(
      await prismaService.member.findUniqueOrThrow({
        where: {
          workspaceId_userId: { workspaceId, userId: invitee.accountId },
        },
      }),
    ).toMatchObject({ role: 'member' });
    expect(
      await prismaService.invitation.findUniqueOrThrow({
        where: { id: invitationId },
      }),
    ).toMatchObject({ status: 'accepted' });
  });

  it("makes the Workspace the invited person's active one", async () => {
    const invitee = await fixtures.aSignedInAccount('accepting-active');
    const { workspaceId, invitationId } = await anInvitationFor(invitee.email);

    await workspaceInviting.accept({
      credential: invitee.credential,
      invitationId,
    });

    const sessions = await prismaService.session.findMany({
      where: { userId: invitee.accountId },
    });
    expect(sessions.map((s) => s.activeOrganizationId)).toEqual([workspaceId]);
  });

  it('lets an Invitation be used once', async () => {
    const invitee = await fixtures.aSignedInAccount('accepting-once');
    const { invitationId } = await anInvitationFor(invitee.email);
    const acceptance = { credential: invitee.credential, invitationId };
    await workspaceInviting.accept(acceptance);

    await expect(workspaceInviting.accept(acceptance)).rejects.toThrow();
  });
});

describe('reissuing an Invitation through the organization plugin', () => {
  it('extends a Pending one for another 7 days, keeping its id', async () => {
    const { owner, workspaceId } = await anOwnerWithAWorkspace();
    const sentAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const invitationId = await fixtures.anInvitation(workspaceId, owner, {
      email: 'ben@acme.test',
      createdAt: sentAt,
      expiresAt: new Date(sentAt.getTime() + SEVEN_DAYS_MS),
    });
    const before = Date.now();

    const reissued = reissuedOf(
      await workspaceInviting.reissue({
        credential: owner.credential,
        workspaceId,
        email: 'ben@acme.test',
      }),
    );

    expect(reissued.invitationId).toBe(invitationId);
    expect(reissued.expiresAt.getTime() - before).toBeGreaterThanOrEqual(
      SEVEN_DAYS_MS - 1000,
    );
  });

  it('stores a new one beside an expired one, leaving the expired one as it was', async () => {
    const { owner, workspaceId } = await anOwnerWithAWorkspace();
    const expiredId = await fixtures.anInvitation(workspaceId, owner, {
      email: 'ben@acme.test',
      expiresAt: new Date(Date.now() - 1000),
    });

    const reissued = reissuedOf(
      await workspaceInviting.reissue({
        credential: owner.credential,
        workspaceId,
        email: 'ben@acme.test',
      }),
    );

    expect(reissued.invitationId).not.toBe(expiredId);
    const expired = await prismaService.invitation.findUniqueOrThrow({
      where: { id: expiredId },
    });
    expect(expired.status).toBe('pending');
  });

  it('answers already a member for an address that joined meanwhile', async () => {
    const { owner, workspaceId } = await anOwnerWithAWorkspace();
    const ben = await fixtures.aSignedInAccount('reissue-ben');
    await fixtures.addMember(workspaceId, ben, 'member');

    expect(
      await workspaceInviting.reissue({
        credential: owner.credential,
        workspaceId,
        email: ben.email,
      }),
    ).toEqual({ outcome: 'already_member' });
  });

  it('records when the email last went out', async () => {
    const { owner, workspaceId } = await anOwnerWithAWorkspace();
    const invitationId = await fixtures.anInvitation(workspaceId, owner, {
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    });
    const sentAt = new Date('2026-10-13T05:00:00Z');

    await workspaceInviting.markSent(invitationId, sentAt);

    const row = await prismaService.invitation.findUniqueOrThrow({
      where: { id: invitationId },
    });
    expect(row.lastSentAt).toEqual(sentAt);
  });
});
