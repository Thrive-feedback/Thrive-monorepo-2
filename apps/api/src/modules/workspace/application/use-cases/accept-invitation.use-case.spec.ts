import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeInvitationQuery,
  FakeInvitationSettling,
  FakeMemberRejoining,
  FakeMembershipQuery,
  FakeSessionWorkspace,
  FakeWorkspaceInviting,
  FakeWorkspaceSwitching,
} from '@test/support/workspace.fakes';
import type { InvitationStatusValue } from '../../domain/value-object/invitation-status.vo';
import {
  InvitationAlreadyAcceptedError,
  InvitationExpiredError,
  InvitationNotForYouError,
  InvitationRevokedError,
} from '../../domain/workspace.errors';
import { InvitationNotFoundError } from '../workspace.errors';
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
    role: 'MEMBER',
    status,
    lastSentAt: NOW,
    expiresAt: new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000),
  });
  const membershipQuery = new FakeMembershipQuery();
  const memberRejoining = new FakeMemberRejoining(membershipQuery);
  const workspaceSwitching = new FakeWorkspaceSwitching(membershipQuery);
  const invitationSettling = new FakeInvitationSettling();
  const sessionWorkspace = new FakeSessionWorkspace();
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new AcceptInvitationUseCase(
    workspaceInviting,
    memberRejoining,
    invitationSettling,
    workspaceSwitching,
    sessionWorkspace,
    invitationQuery,
    membershipQuery,
    unitOfWork,
    new FakeClock(NOW),
  );
  return {
    workspaceInviting,
    memberRejoining,
    invitationSettling,
    sessionWorkspace,
    workspaceSwitching,
    membershipQuery,
    unitOfWork,
    useCase,
  };
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

  it("puts the person's session in the Workspace joined", async () => {
    const { sessionWorkspace, useCase } = setUp();

    await useCase.execute(acceptance());

    expect(await sessionWorkspace.selectedIn(SOMCHAI_COOKIE)).toBe(ACME.id);
  });

  it('lists the Workspace joined first, as the one used last', async () => {
    const { workspaceSwitching, useCase } = setUp();

    await useCase.execute(acceptance());

    expect(workspaceSwitching.switches).toEqual([
      { workspaceId: ACME.id, accountId: 'account-somchai', switchedAt: NOW },
    ]);
  });

  it("runs on the Workspace's key, so it never interleaves with Deactivating, Reactivating or a Role change there", async () => {
    const { unitOfWork, useCase } = setUp();

    await useCase.execute(acceptance());

    expect(unitOfWork.opened).toEqual([
      { serializeOn: `workspace-roles:${ACME.id}` },
    ]);
  });

  it('settles a Pending Invitation for someone already back in that Workspace another way', async () => {
    const { invitationSettling, workspaceInviting, membershipQuery, useCase } =
      setUp();
    membershipQuery.memberships.push({
      accountId: 'account-somchai',
      workspace: ACME,
      role: 'MEMBER',
    });

    await useCase.execute(acceptance());

    expect(invitationSettling.settled).toEqual([INVITATION_ID]);
    expect(workspaceInviting.accepted).toEqual([]);
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

  it('lets someone already in another Workspace join, and leaves that one as it was', async () => {
    const { workspaceInviting, membershipQuery, useCase } = setUp();
    membershipQuery.memberships.push({
      accountId: 'account-somchai',
      workspace: OTHER,
      role: 'ADMIN',
    });

    await useCase.execute(acceptance());

    expect(workspaceInviting.accepted).toHaveLength(1);
    expect(
      await membershipQuery.membershipInWorkspace('account-somchai', OTHER.id),
    ).toEqual({ workspace: OTHER, role: 'ADMIN' });
  });

  it("lets another Workspace's only Admin join, still its Admin", async () => {
    const { workspaceInviting, membershipQuery, useCase } = setUp();
    membershipQuery.memberships.push({
      accountId: 'account-somchai',
      workspace: OTHER,
      role: 'ADMIN',
    });

    await useCase.execute(acceptance());

    expect(workspaceInviting.accepted).toHaveLength(1);
    expect(await membershipQuery.adminCountOf(OTHER.id)).toBe(1);
  });

  it('brings back someone Deactivated in that Workspace, with the Role the Invitation names', async () => {
    const { workspaceInviting, memberRejoining, membershipQuery, useCase } =
      setUp();
    membershipQuery.memberships.push({
      accountId: 'account-somchai',
      workspace: ACME,
      role: 'ADMIN',
      deactivatedAt: NOW,
    });

    await useCase.execute(acceptance());

    expect(memberRejoining.rejoins).toEqual([
      {
        invitationId: INVITATION_ID,
        workspaceId: ACME.id,
        accountId: 'account-somchai',
        role: 'MEMBER',
      },
    ]);
    expect(workspaceInviting.accepted).toEqual([]);
    expect(
      await membershipQuery.membershipInWorkspace('account-somchai', ACME.id),
    ).toEqual({ workspace: ACME, role: 'MEMBER' });
  });

  it('puts the session of someone who came back in that Workspace', async () => {
    const { workspaceSwitching, sessionWorkspace, membershipQuery, useCase } =
      setUp();
    membershipQuery.memberships.push({
      accountId: 'account-somchai',
      workspace: ACME,
      role: 'MEMBER',
      deactivatedAt: NOW,
    });

    await useCase.execute(acceptance());

    expect(workspaceSwitching.switches).toEqual([
      { workspaceId: ACME.id, accountId: 'account-somchai', switchedAt: NOW },
    ]);
    expect(await sessionWorkspace.selectedIn(SOMCHAI_COOKIE)).toBe(ACME.id);
  });

  it('switches to nothing when the person was already in that Workspace', async () => {
    const { workspaceSwitching, membershipQuery, useCase } = setUp('ACCEPTED');
    membershipQuery.memberships.push({
      accountId: 'account-somchai',
      workspace: ACME,
      role: 'MEMBER',
    });

    await useCase.execute(acceptance());

    expect(workspaceSwitching.switches).toEqual([]);
  });

  it('lets someone Deactivated elsewhere join as usual', async () => {
    const { workspaceInviting, memberRejoining, membershipQuery, useCase } =
      setUp();
    membershipQuery.memberships.push({
      accountId: 'account-somchai',
      workspace: OTHER,
      role: 'MEMBER',
      deactivatedAt: NOW,
    });

    await useCase.execute(acceptance());

    expect(workspaceInviting.accepted).toHaveLength(1);
    expect(memberRejoining.rejoins).toEqual([]);
  });
});
