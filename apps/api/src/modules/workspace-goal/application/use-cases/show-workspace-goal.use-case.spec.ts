import { describe, expect, it } from 'bun:test';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import { FakeWorkspaceGoalRepository } from '@test/support/workspace-goal.fakes';
import { WorkspaceGoal } from '../../domain/entity/workspace-goal.entity';
import { WorkspaceGoalName } from '../../domain/value-object/workspace-goal-name.vo';
import { WorkspaceGoalAlreadyActiveError } from '../../domain/workspace-goal.errors';
import {
  NotAllowedToManageWorkspaceGoalsError,
  WorkspaceGoalNotFoundError,
} from '../workspace-goal.errors';
import { ShowWorkspaceGoalUseCase } from './show-workspace-goal.use-case';

const WORKSPACE_ID = 'workspace-acme';
const WORKSPACE_GOAL_ID = 'workspace-goal-ownership';
const ANN = 'account-ann';
const BEN = 'account-ben';

function setUp() {
  const hidden = WorkspaceGoal.create({
    id: WORKSPACE_GOAL_ID,
    workspaceId: WORKSPACE_ID,
    name: WorkspaceGoalName.of('ownership'),
    description: null,
  });
  hidden.hide();
  const workspaceGoalRepository = new FakeWorkspaceGoalRepository().with(
    hidden,
  );
  const useCase = new ShowWorkspaceGoalUseCase(
    workspaceGoalRepository,
    new FakeWorkspaceMembershipPort()
      .withAdmins(WORKSPACE_ID, ANN)
      .with(WORKSPACE_ID, BEN),
    new FakeUnitOfWork(),
  );
  return { workspaceGoalRepository, useCase };
}

function statusOf(repository: FakeWorkspaceGoalRepository): string | undefined {
  return repository.saved(WORKSPACE_GOAL_ID)?.snapshot().status;
}

describe('an Admin showing a hidden Workspace Goal again', () => {
  it('stores it active', async () => {
    const { workspaceGoalRepository, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
      workspaceGoalId: WORKSPACE_GOAL_ID,
    });

    expect(statusOf(workspaceGoalRepository)).toBe('ACTIVE');
  });

  it('is refused when it is already shown', async () => {
    const { useCase } = setUp();
    const showing = {
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
      workspaceGoalId: WORKSPACE_GOAL_ID,
    };
    await useCase.execute(showing);

    await expect(useCase.execute(showing)).rejects.toThrow(
      WorkspaceGoalAlreadyActiveError,
    );
  });

  it('is refused to a Member who is not an Admin, leaving it hidden', async () => {
    const { workspaceGoalRepository, useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: WORKSPACE_ID,
        accountId: BEN,
        workspaceGoalId: WORKSPACE_GOAL_ID,
      }),
    ).rejects.toThrow(NotAllowedToManageWorkspaceGoalsError);
    expect(statusOf(workspaceGoalRepository)).toBe('HIDDEN');
  });

  it('is refused for an id the Workspace does not have', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: WORKSPACE_ID,
        accountId: ANN,
        workspaceGoalId: 'workspace-goal-unknown',
      }),
    ).rejects.toThrow(WorkspaceGoalNotFoundError);
  });
});
