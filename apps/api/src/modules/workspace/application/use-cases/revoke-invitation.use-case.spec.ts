import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import {
  FakeInvitationQuery,
  FakeWorkspaceInviting,
} from '@test/support/workspace.fakes';
import type { InvitationStatusValue } from '../../domain/value-object/invitation-status.vo';
import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';
import {
  InvitationAlreadyAcceptedError,
  InvitationRevokedError,
} from '../../domain/workspace.errors';
import {
  InvitationNotFoundError,
  NotAllowedToRevokeInvitationsError,
} from '../workspace.errors';
import { RevokeInvitationUseCase } from './revoke-invitation.use-case';

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000001';
const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const OTHER = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Other' };
const ANN_COOKIE = 'thrive.session_token=ann';
const NOW = new Date('2026-10-10T03:00:00Z');

function setUp(
  status: InvitationStatusValue = 'PENDING',
  workspace: { id: string; name: string } = ACME,
) {
  const workspaceInviting = new FakeWorkspaceInviting(NOW);
  const invitationQuery = new FakeInvitationQuery();
  invitationQuery.details.set(INVITATION_ID, {
    invitationId: INVITATION_ID,
    workspace,
    inviterAccountId: 'account-ann',
    email: 'somchai@acme.co',
    status,
  });
  const useCase = new RevokeInvitationUseCase(
    workspaceInviting,
    invitationQuery,
    new FakeClock(NOW),
  );
  return { workspaceInviting, useCase };
}

function revocation(role: MemberRoleValue = 'OWNER') {
  return {
    credential: ANN_COOKIE,
    membership: { workspace: ACME, role },
    invitationId: INVITATION_ID,
  };
}

describe('revoking an Invitation', () => {
  it('lets the Owner revoke one, on their own session', async () => {
    const { workspaceInviting, useCase } = setUp();

    await useCase.execute(revocation('OWNER'));

    expect(workspaceInviting.revoked).toEqual([
      { credential: ANN_COOKIE, invitationId: INVITATION_ID },
    ]);
  });

  it('lets an Admin revoke one', async () => {
    const { workspaceInviting, useCase } = setUp();

    await useCase.execute(revocation('ADMIN'));

    expect(workspaceInviting.revoked).toHaveLength(1);
  });

  it('lets an expired one be revoked, to clear it away', async () => {
    const { workspaceInviting, useCase } = setUp('EXPIRED');

    await useCase.execute(revocation());

    expect(workspaceInviting.revoked).toHaveLength(1);
  });

  it('refuses a Member with no management rights', async () => {
    const { workspaceInviting, useCase } = setUp();

    await expect(useCase.execute(revocation('MEMBER'))).rejects.toThrow(
      NotAllowedToRevokeInvitationsError,
    );
    expect(workspaceInviting.revoked).toEqual([]);
  });

  it("answers another Workspace's Invitation as not found", async () => {
    const { workspaceInviting, useCase } = setUp('PENDING', OTHER);

    await expect(useCase.execute(revocation())).rejects.toThrow(
      InvitationNotFoundError,
    );
    expect(workspaceInviting.revoked).toEqual([]);
  });

  it('refuses one already accepted', async () => {
    const { useCase } = setUp('ACCEPTED');

    await expect(useCase.execute(revocation())).rejects.toThrow(
      InvitationAlreadyAcceptedError,
    );
  });

  it('refuses one already revoked', async () => {
    const { useCase } = setUp('REVOKED');

    await expect(useCase.execute(revocation())).rejects.toThrow(
      InvitationRevokedError,
    );
  });
});
