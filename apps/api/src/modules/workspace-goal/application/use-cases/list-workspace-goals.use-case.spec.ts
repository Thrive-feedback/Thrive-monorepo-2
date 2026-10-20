import { describe, expect, it } from 'bun:test';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import { FakeWorkspaceGoalQuery } from '@test/support/workspace-goal.fakes';
import { ListWorkspaceGoalsUseCase } from './list-workspace-goals.use-case';

const WORKSPACE_ID = 'workspace-acme';
const ANN = 'account-ann';
const BEN = 'account-ben';
const PAGE = { page: 1, pageSize: 20 };

function setUp() {
  const workspaceGoalQuery = new FakeWorkspaceGoalQuery();
  const useCase = new ListWorkspaceGoalsUseCase(
    workspaceGoalQuery,
    new FakeWorkspaceMembershipPort()
      .withAdmins(WORKSPACE_ID, ANN)
      .with(WORKSPACE_ID, BEN),
  );
  return { workspaceGoalQuery, useCase };
}

describe('listing the Workspace Goals in Settings', () => {
  it('answers an Admin the hidden ones too', async () => {
    const { workspaceGoalQuery, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
      page: PAGE,
    });

    expect(workspaceGoalQuery.asked).toEqual([
      { workspaceId: WORKSPACE_ID, includeHidden: true },
    ]);
  });

  it('answers a Member the active ones only', async () => {
    const { workspaceGoalQuery, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      accountId: BEN,
      page: PAGE,
    });

    expect(workspaceGoalQuery.asked).toEqual([
      { workspaceId: WORKSPACE_ID, includeHidden: false },
    ]);
  });
});
