import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeMembershipQuery,
  FakeSessionWorkspace,
  FakeWorkspaceSwitching,
} from '@test/support/workspace.fakes';
import { SwitchWorkspaceUseCase } from './switch-workspace.use-case';

const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const BETA = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Beta' };
const ANN_COOKIE = 'thrive.session_token=ann';
const EARLIER = new Date('2026-10-17T03:00:00Z');
const NOW = new Date('2026-10-18T03:00:00Z');

function setUp() {
  const membershipQuery = new FakeMembershipQuery();
  membershipQuery.memberships.push(
    {
      accountId: 'account-ann',
      workspace: ACME,
      role: 'ADMIN',
      lastUsedAt: EARLIER,
    },
    { accountId: 'account-ann', workspace: BETA, role: 'MEMBER' },
  );
  const workspaceSwitching = new FakeWorkspaceSwitching(membershipQuery);
  const sessionWorkspace = new FakeSessionWorkspace();
  sessionWorkspace.selected.set(ANN_COOKIE, ACME.id);
  const useCase = new SwitchWorkspaceUseCase(
    workspaceSwitching,
    sessionWorkspace,
    new FakeUnitOfWork(),
    new FakeClock(NOW),
  );
  return { membershipQuery, workspaceSwitching, sessionWorkspace, useCase };
}

function switchingTo(workspace: typeof BETA) {
  return {
    accountId: 'account-ann',
    credential: ANN_COOKIE,
    membership: { workspace, role: 'MEMBER' as const },
  };
}

describe('switching Workspace', () => {
  it("puts the Member's session in the Workspace chosen", async () => {
    const { sessionWorkspace, useCase } = setUp();

    await useCase.execute(switchingTo(BETA));

    expect(await sessionWorkspace.selectedIn(ANN_COOKIE)).toBe(BETA.id);
  });

  it('leaves another session of the same Member where it was', async () => {
    const { sessionWorkspace, useCase } = setUp();
    sessionWorkspace.selected.set('thrive.session_token=ann-phone', ACME.id);

    await useCase.execute(switchingTo(BETA));

    expect(
      await sessionWorkspace.selectedIn('thrive.session_token=ann-phone'),
    ).toBe(ACME.id);
  });

  it('lists the Workspace chosen first, as the one used last', async () => {
    const { membershipQuery, useCase } = setUp();

    await useCase.execute(switchingTo(BETA));

    const listed = await membershipQuery.membershipsOfAccount(
      'account-ann',
      { page: 1, pageSize: 2 },
      'ACTIVE',
    );
    expect(listed.items.map((m) => m.workspace.id)).toEqual([BETA.id, ACME.id]);
  });
});
