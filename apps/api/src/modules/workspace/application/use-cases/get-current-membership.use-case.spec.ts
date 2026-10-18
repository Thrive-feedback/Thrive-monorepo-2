import { describe, expect, it } from 'bun:test';
import {
  FakeMembershipQuery,
  FakeSessionWorkspace,
} from '@test/support/workspace.fakes';
import { GetCurrentMembershipUseCase } from './get-current-membership.use-case';

const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const BETA = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Beta' };
const GAMMA = { id: '0199a0f0-0000-7000-8000-0000000000cc', name: 'Gamma' };
const ANN_COOKIE = 'thrive.session_token=ann';
const NOW = new Date('2026-10-18T03:00:00Z');

function setUp(...workspaces: (typeof ACME)[]) {
  const membershipQuery = new FakeMembershipQuery();
  for (const workspace of workspaces) {
    membershipQuery.memberships.push({
      accountId: 'account-ann',
      workspace,
      role: 'MEMBER',
    });
  }
  const sessionWorkspace = new FakeSessionWorkspace();
  const useCase = new GetCurrentMembershipUseCase(
    sessionWorkspace,
    membershipQuery,
  );
  return { membershipQuery, sessionWorkspace, useCase };
}

function deactivate(
  membershipQuery: FakeMembershipQuery,
  workspace: typeof ACME,
) {
  const index = membershipQuery.memberships.findIndex(
    (m) => m.workspace.id === workspace.id,
  );
  const found = membershipQuery.memberships[index];
  if (found) {
    membershipQuery.memberships[index] = { ...found, deactivatedAt: NOW };
  }
}

const ASKING = { accountId: 'account-ann', credential: ANN_COOKIE };

describe('the Workspace a session is in', () => {
  it('is the one the session chose, while the Member is active there', async () => {
    const { sessionWorkspace, useCase } = setUp(ACME, BETA);
    sessionWorkspace.selected.set(ANN_COOKIE, BETA.id);

    expect(await useCase.execute(ASKING)).toEqual({
      workspace: BETA,
      role: 'MEMBER',
    });
  });

  it('is none for a new session of someone in two Workspaces, so they choose', async () => {
    const { useCase } = setUp(ACME, BETA);

    expect(await useCase.execute(ASKING)).toBeNull();
  });

  it('is the only one for someone in one Workspace, without choosing', async () => {
    const { useCase } = setUp(ACME);

    expect(await useCase.execute(ASKING)).toEqual({
      workspace: ACME,
      role: 'MEMBER',
    });
  });

  it('is none once they are Deactivated in it while two others remain', async () => {
    const { membershipQuery, sessionWorkspace, useCase } = setUp(
      ACME,
      BETA,
      GAMMA,
    );
    sessionWorkspace.selected.set(ANN_COOKIE, BETA.id);
    deactivate(membershipQuery, BETA);

    expect(await useCase.execute(ASKING)).toBeNull();
  });

  it('is the one left once they are Deactivated in the other', async () => {
    const { membershipQuery, sessionWorkspace, useCase } = setUp(ACME, BETA);
    sessionWorkspace.selected.set(ANN_COOKIE, BETA.id);
    deactivate(membershipQuery, BETA);

    expect(await useCase.execute(ASKING)).toEqual({
      workspace: ACME,
      role: 'MEMBER',
    });
  });

  it('is none for someone in no Workspace', async () => {
    const { useCase } = setUp();

    expect(await useCase.execute(ASKING)).toBeNull();
  });
});
