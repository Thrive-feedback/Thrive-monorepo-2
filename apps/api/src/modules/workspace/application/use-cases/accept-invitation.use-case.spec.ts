import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeInvitationQuery,
  FakeMembershipQuery,
  FakeWorkspaceInviting,
} from '@test/support/workspace.fakes';
import type { InvitationStatusValue } from '../../domain/value-object/invitation-status.vo';
import {
  InvitationAlreadyAcceptedError,
  InvitationExpiredError,
  InvitationNotForYouError,
  InvitationRevokedError,
} from '../../domain/workspace.errors';
import {
  AlreadyInAWorkspaceError,
  InvitationNotFoundError,
} from '../workspace.errors';
import { AcceptInvitationUseCase } from './accept-invitation.use-case';

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000001';
const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const OTHER = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Other' };
const SOMCHAI_COOKIE = 'thrive.session_token=somchai';
const NOW = new Date('2026-10-10T03:00:00Z');

function setUp(status: InvitationStatusValue = 'PENDING') {
  const workspaceInviting = new FakeWorkspaceInviting(NOW);
  const invitationQuery = new FakeInvitationQuery();
  invitationQuery.details.set(INVITATION_ID, {
    invitationId: INVITATION_ID,
    workspace: ACME,
    inviterAccountId: 'account-ann',
    email: 'somchai@acme.co',
    status,
  });
  const membershipQuery = new FakeMembershipQuery();
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new AcceptInvitationUseCase(
    workspaceInviting,
    invitationQuery,
    membershipQuery,
    unitOfWork,
    new FakeClock(NOW),
  );
  return { workspaceInviting, membershipQuery, unitOfWork, useCase };
}

function acceptance(overrides: Partial<{ accountEmail: string }> = {}) {
  return {
    accountId: 'account-somchai',
    accountEmail: overrides.accountEmail ?? 'somchai@acme.co',
    credential: SOMCHAI_COOKIE,
    invitationId: INVITATION_ID,
  };
}

describe('accepting an Invitation', () => {
  it('lets the invited person join, on their own session', async () => {
    const { workspaceInviting, useCase } = setUp();

    await useCase.execute(acceptance());

    expect(workspaceInviting.accepted).toEqual([
      { credential: SOMCHAI_COOKIE, invitationId: INVITATION_ID },
    ]);
  });

  it('matches the invited address whatever its case', async () => {
    const { workspaceInviting, useCase } = setUp();

    await useCase.execute(acceptance({ accountEmail: 'Somchai@ACME.co' }));

    expect(workspaceInviting.accepted).toHaveLength(1);
  });

  it('runs on the same per-Account key as creating a Workspace', async () => {
    const { unitOfWork, useCase } = setUp();

    await useCase.execute(acceptance());

    expect(unitOfWork.opened).toEqual([
      { serializeOn: 'account-workspace:account-somchai' },
    ]);
  });

  it('refuses someone signed in with a different address', async () => {
    const { workspaceInviting, useCase } = setUp();

    await expect(
      useCase.execute(acceptance({ accountEmail: 'nok@acme.co' })),
    ).rejects.toThrow(InvitationNotForYouError);
    expect(workspaceInviting.accepted).toEqual([]);
  });

  it('refuses an Invitation that has expired', async () => {
    const { useCase } = setUp('EXPIRED');

    await expect(useCase.execute(acceptance())).rejects.toThrow(
      InvitationExpiredError,
    );
  });

  it('refuses an Invitation that was revoked', async () => {
    const { useCase } = setUp('REVOKED');

    await expect(useCase.execute(acceptance())).rejects.toThrow(
      InvitationRevokedError,
    );
  });

  it('refuses an Invitation someone else already used', async () => {
    const { useCase } = setUp('ACCEPTED');

    await expect(useCase.execute(acceptance())).rejects.toThrow(
      InvitationAlreadyAcceptedError,
    );
  });

  it('refuses an id no Invitation has', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({
        ...acceptance(),
        invitationId: '0199a0f0-0000-7000-8000-00000000ffff',
      }),
    ).rejects.toThrow(InvitationNotFoundError);
  });

  it('changes nothing for someone already a Member of that Workspace, used Invitation or not', async () => {
    const { workspaceInviting, membershipQuery, useCase } = setUp('ACCEPTED');
    membershipQuery.memberships.push({
      accountId: 'account-somchai',
      workspace: ACME,
      role: 'MEMBER',
    });

    await useCase.execute(acceptance());

    expect(workspaceInviting.accepted).toEqual([]);
  });

  it('refuses someone already a Member of another Workspace, one Workspace per person', async () => {
    const { workspaceInviting, membershipQuery, useCase } = setUp();
    membershipQuery.memberships.push({
      accountId: 'account-somchai',
      workspace: OTHER,
      role: 'OWNER',
    });

    await expect(useCase.execute(acceptance())).rejects.toThrow(
      AlreadyInAWorkspaceError,
    );
    expect(workspaceInviting.accepted).toEqual([]);
  });
});
