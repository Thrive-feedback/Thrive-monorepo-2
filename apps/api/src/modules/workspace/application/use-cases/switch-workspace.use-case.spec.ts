import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeMembershipQuery,
  FakeWorkspaceSwitching,
} from '@test/support/workspace.fakes';
import { SwitchWorkspaceUseCase } from './switch-workspace.use-case';

const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const BETA = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Beta' };
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
  const useCase = new SwitchWorkspaceUseCase(
    workspaceSwitching,
    new FakeUnitOfWork(),
    new FakeClock(NOW),
  );
  return { membershipQuery, workspaceSwitching, useCase };
}

describe('switching Workspace', () => {
  it('makes the chosen Workspace the one the Member is in', async () => {
    const { membershipQuery, useCase } = setUp();

    await useCase.execute({
      accountId: 'account-ann',
      membership: { workspace: BETA, role: 'MEMBER' },
    });

    const current = await membershipQuery.membershipsOfAccount(
      'account-ann',
      { page: 1, pageSize: 1 },
      'ACTIVE',
    );
    expect(current.items).toEqual([{ workspace: BETA, role: 'MEMBER' }]);
  });

  it('records when it was switched to', async () => {
    const { workspaceSwitching, useCase } = setUp();

    await useCase.execute({
      accountId: 'account-ann',
      membership: { workspace: BETA, role: 'MEMBER' },
    });

    expect(workspaceSwitching.switches).toEqual([
      { workspaceId: BETA.id, accountId: 'account-ann', switchedAt: NOW },
    ]);
  });
});
