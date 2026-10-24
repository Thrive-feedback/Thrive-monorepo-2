import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { SystemClock } from '@app/infrastructure/system-clock.adapter';
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
const workspaceInviting = new BetterAuthWorkspaceInvitingAdapter(
  auth,
  new SystemClock(),
);
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

async function anAdminWithAWorkspace() {
  const admin = await fixtures.aSignedInAccount('inviting-admin');
  return { admin, workspaceId: await fixtures.aWorkspace(admin) };
}

describe('storing Invitations through the organization plugin', () => {
  it('stores a Pending Invitation for the Member role, expiring in 7 days', async () => {
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const before = Date.now();

    const stored = invited(
      await workspaceInviting.invite({
        credential: admin.credential,
        inviterAccountId: admin.accountId,
        workspaceId,
        email: 'ben@acme.test',
        role: 'MEMBER' as const,
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
      inviterId: admin.accountId,
    });
    expect(stored.expiresAt.getTime() - before).toBeGreaterThanOrEqual(
      SEVEN_DAYS_MS - 1000,
    );
    expect(stored.expiresAt.getTime() - before).toBeLessThanOrEqual(
      SEVEN_DAYS_MS + 60_000,
    );
  });

  it('answers already invited for an address with a Pending Invitation', async () => {
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const request = {
      credential: admin.credential,
      inviterAccountId: admin.accountId,
      workspaceId,
      email: 'ben@acme.test',
      role: 'MEMBER' as const,
    };
    await workspaceInviting.invite(request);

    expect(await workspaceInviting.invite(request)).toEqual({
      outcome: 'already_invited',
    });
  });

  it('answers already a Member for the address of someone in the Workspace', async () => {
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const member = await fixtures.aSignedInAccount('inviting-member');
    await fixtures.addMember(workspaceId, member, 'member');

    expect(
      await workspaceInviting.invite({
        credential: admin.credential,
        inviterAccountId: admin.accountId,
        workspaceId,
        email: member.email,
        role: 'MEMBER' as const,
      }),
    ).toEqual({ outcome: 'already_member' });
  });

  it('revokes an Invitation, after which the address can be invited again', async () => {
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const request = {
      credential: admin.credential,
      inviterAccountId: admin.accountId,
      workspaceId,
      email: 'ben@acme.test',
      role: 'MEMBER' as const,
    };
    const first = invited(await workspaceInviting.invite(request));

    await workspaceInviting.revoke({
      credential: admin.credential,
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

describe('inviting back someone Deactivated in the Workspace', () => {
  async function aDeactivatedMember() {
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const member = await fixtures.aSignedInAccount('inviting-deactivated');
    await fixtures.addMember(workspaceId, member, 'member');
    await prismaService.member.updateMany({
      where: { workspaceId, userId: member.accountId },
      data: { deactivatedAt: new Date() },
    });
    const request = {
      credential: admin.credential,
      inviterAccountId: admin.accountId,
      workspaceId,
      email: member.email,
      role: 'ADMIN' as const,
    };
    return { admin, workspaceId, request };
  }

  it('answers already a Member through the plugin, which counts their kept row', async () => {
    const { request } = await aDeactivatedMember();

    expect(await workspaceInviting.invite(request)).toEqual({
      outcome: 'already_member',
    });
  });

  it('stores a Pending Invitation with the Role chosen, expiring in 7 days', async () => {
    const { admin, workspaceId, request } = await aDeactivatedMember();
    const before = Date.now();

    const stored = invited(await workspaceInviting.inviteBack(request));

    expect(
      await prismaService.invitation.findUniqueOrThrow({
        where: { id: stored.invitationId },
      }),
    ).toMatchObject({
      workspaceId,
      email: request.email,
      role: 'admin',
      status: 'pending',
      inviterId: admin.accountId,
    });
    expect(stored.expiresAt.getTime() - before).toBeGreaterThanOrEqual(
      SEVEN_DAYS_MS - 1000,
    );
  });

  it('answers already invited while that Invitation is Pending', async () => {
    const { request } = await aDeactivatedMember();
    await workspaceInviting.inviteBack(request);

    expect(await workspaceInviting.inviteBack(request)).toEqual({
      outcome: 'already_invited',
    });
  });

  it('extends the Pending one on a resend, keeping its id', async () => {
    const { request } = await aDeactivatedMember();
    const first = invited(await workspaceInviting.inviteBack(request));

    const reissued = reissuedOf(await workspaceInviting.reissueBack(request));

    expect(reissued.invitationId).toBe(first.invitationId);
    expect(
      await prismaService.invitation.count({
        where: { workspaceId: request.workspaceId, email: request.email },
      }),
    ).toBe(1);
  });
});

describe('accepting an Invitation through the organization plugin', () => {
  async function anInvitationFor(
    email: string,
    role: 'ADMIN' | 'MEMBER' = 'MEMBER',
  ) {
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const stored = invited(
      await workspaceInviting.invite({
        credential: admin.credential,
        inviterAccountId: admin.accountId,
        workspaceId,
        email,
        role,
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

  it('makes someone invited as an Admin an Admin', async () => {
    const invitee = await fixtures.aSignedInAccount('accepting-admin');
    const { workspaceId, invitationId } = await anInvitationFor(
      invitee.email,
      'ADMIN',
    );

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
    ).toMatchObject({ role: 'admin' });
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
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const sentAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const invitationId = await fixtures.anInvitation(workspaceId, admin, {
      email: 'ben@acme.test',
      createdAt: sentAt,
      expiresAt: new Date(sentAt.getTime() + SEVEN_DAYS_MS),
    });
    const before = Date.now();

    const reissued = reissuedOf(
      await workspaceInviting.reissue({
        credential: admin.credential,
        inviterAccountId: admin.accountId,
        workspaceId,
        email: 'ben@acme.test',
        role: 'MEMBER' as const,
      }),
    );

    expect(reissued.invitationId).toBe(invitationId);
    expect(reissued.expiresAt.getTime() - before).toBeGreaterThanOrEqual(
      SEVEN_DAYS_MS - 1000,
    );
  });

  it('stores a new one beside an expired one, leaving the expired one as it was', async () => {
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const expiredId = await fixtures.anInvitation(workspaceId, admin, {
      email: 'ben@acme.test',
      expiresAt: new Date(Date.now() - 1000),
    });

    const reissued = reissuedOf(
      await workspaceInviting.reissue({
        credential: admin.credential,
        inviterAccountId: admin.accountId,
        workspaceId,
        email: 'ben@acme.test',
        role: 'MEMBER' as const,
      }),
    );

    expect(reissued.invitationId).not.toBe(expiredId);
    const expired = await prismaService.invitation.findUniqueOrThrow({
      where: { id: expiredId },
    });
    expect(expired.status).toBe('pending');
  });

  it('answers already a member for an address that joined meanwhile', async () => {
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const ben = await fixtures.aSignedInAccount('reissue-ben');
    await fixtures.addMember(workspaceId, ben, 'member');

    expect(
      await workspaceInviting.reissue({
        credential: admin.credential,
        inviterAccountId: admin.accountId,
        workspaceId,
        email: ben.email,
        role: 'MEMBER' as const,
      }),
    ).toEqual({ outcome: 'already_member' });
  });

  it('records when the email last went out', async () => {
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const invitationId = await fixtures.anInvitation(workspaceId, admin, {
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    });
    const sentAt = new Date('2026-10-13T05:00:00Z');

    await workspaceInviting.markSent(invitationId, sentAt);

    const row = await prismaService.invitation.findUniqueOrThrow({
      where: { id: invitationId },
    });
    expect(row.lastSentAt).toEqual(sentAt);
  });

  it('puts back when it was last sent and when it expires', async () => {
    const { admin, workspaceId } = await anAdminWithAWorkspace();
    const invitationId = await fixtures.anInvitation(workspaceId, admin, {
      lastSentAt: new Date(),
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    });
    const before = {
      lastSentAt: new Date('2026-10-13T05:00:00Z'),
      expiresAt: new Date('2026-10-20T05:00:00Z'),
    };

    await workspaceInviting.restoreSent(invitationId, before);

    const row = await prismaService.invitation.findUniqueOrThrow({
      where: { id: invitationId },
    });
    expect({ lastSentAt: row.lastSentAt, expiresAt: row.expiresAt }).toEqual(
      before,
    );
  });
});
