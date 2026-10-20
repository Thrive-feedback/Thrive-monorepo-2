import { describe, expect, it } from 'bun:test';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import { FakeWorkspaceGoalRepository } from '@test/support/workspace-goal.fakes';
import { WorkspaceGoal } from '../../domain/entity/workspace-goal.entity';
import { WorkspaceGoalName } from '../../domain/value-object/workspace-goal-name.vo';
import { WorkspaceGoalAlreadyHiddenError } from '../../domain/workspace-goal.errors';
import {
  NotAllowedToManageWorkspaceGoalsError,
  WorkspaceGoalNotFoundError,
} from '../workspace-goal.errors';
import { HideWorkspaceGoalUseCase } from './hide-workspace-goal.use-case';

const WORKSPACE_ID = 'workspace-acme';
const OTHER_WORKSPACE_ID = 'workspace-globex';
const WORKSPACE_GOAL_ID = 'workspace-goal-ownership';
const ANN = 'account-ann';
const BEN = 'account-ben';

function setUp() {
  const workspaceGoalRepository = new FakeWorkspaceGoalRepository().with(
    WorkspaceGoal.create({
      id: WORKSPACE_GOAL_ID,
      workspaceId: WORKSPACE_ID,
      name: WorkspaceGoalName.of('ownership'),
      description: null,
    }),
  );
  const useCase = new HideWorkspaceGoalUseCase(
    workspaceGoalRepository,
    new FakeWorkspaceMembershipPort()
      .withAdmins(WORKSPACE_ID, ANN)
      .with(WORKSPACE_ID, BEN)
      .withAdmins(OTHER_WORKSPACE_ID, BEN),
    new FakeUnitOfWork(),
  );
  return { workspaceGoalRepository, useCase };
}

function statusOf(repository: FakeWorkspaceGoalRepository): string | undefined {
  return repository.saved(WORKSPACE_GOAL_ID)?.snapshot().status;
}

describe('an Admin hiding a Workspace Goal', () => {
  it('stores it hidden', async () => {
    const { workspaceGoalRepository, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
      workspaceGoalId: WORKSPACE_GOAL_ID,
    });

    expect(statusOf(workspaceGoalRepository)).toBe('HIDDEN');
  });

  it('is refused when it is already hidden', async () => {
    const { useCase } = setUp();
    const hiding = {
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
      workspaceGoalId: WORKSPACE_GOAL_ID,
    };
    await useCase.execute(hiding);

    await expect(useCase.execute(hiding)).rejects.toThrow(
      WorkspaceGoalAlreadyHiddenError,
    );
  });

  it('is refused to a Member who is not an Admin, leaving it shown', async () => {
    const { workspaceGoalRepository, useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: WORKSPACE_ID,
        accountId: BEN,
        workspaceGoalId: WORKSPACE_GOAL_ID,
      }),
    ).rejects.toThrow(NotAllowedToManageWorkspaceGoalsError);
    expect(statusOf(workspaceGoalRepository)).toBe('ACTIVE');
  });

  it("cannot find another Workspace's, even for an Admin of their own", async () => {
    const { workspaceGoalRepository, useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: OTHER_WORKSPACE_ID,
        accountId: BEN,
        workspaceGoalId: WORKSPACE_GOAL_ID,
      }),
    ).rejects.toThrow(WorkspaceGoalNotFoundError);
    expect(statusOf(workspaceGoalRepository)).toBe('ACTIVE');
  });
});
