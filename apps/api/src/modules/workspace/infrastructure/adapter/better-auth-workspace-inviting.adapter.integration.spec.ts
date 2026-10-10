import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { WorkspaceFixtures } from '@test/support/workspace.integration-fixtures';
import type { InvitationStored } from '../../application/port/workspace-inviting.port';
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
