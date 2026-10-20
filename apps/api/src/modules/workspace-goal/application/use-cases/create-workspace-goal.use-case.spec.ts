import { describe, expect, it } from 'bun:test';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import { FakeWorkspaceGoalRepository } from '@test/support/workspace-goal.fakes';
import { WorkspaceGoal } from '../../domain/entity/workspace-goal.entity';
import { WorkspaceGoalName } from '../../domain/value-object/workspace-goal-name.vo';
import {
  WorkspaceGoalNameHasSpacesError,
  WorkspaceGoalNameTakenError,
} from '../../domain/workspace-goal.errors';
import { NotAllowedToManageWorkspaceGoalsError } from '../workspace-goal.errors';
import { CreateWorkspaceGoalUseCase } from './create-workspace-goal.use-case';

const WORKSPACE_ID = 'workspace-acme';
const OTHER_WORKSPACE_ID = 'workspace-globex';
const WORKSPACE_GOAL_ID = 'workspace-goal-new';
const ANN = 'account-ann';
const BEN = 'account-ben';

function hiddenOwnership(workspaceId: string): WorkspaceGoal {
  const workspaceGoal = WorkspaceGoal.create({
    id: `ownership-of-${workspaceId}`,
    workspaceId,
    name: WorkspaceGoalName.of('ownership'),
    description: null,
  });
  workspaceGoal.hide();
  return workspaceGoal;
}

function setUp(workspaceGoalRepository = new FakeWorkspaceGoalRepository()) {
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new CreateWorkspaceGoalUseCase(
    workspaceGoalRepository,
    new FakeWorkspaceMembershipPort()
      .withAdmins(WORKSPACE_ID, ANN)
      .with(WORKSPACE_ID, BEN),
    new FakeIdGenerator(WORKSPACE_GOAL_ID),
    unitOfWork,
  );
  return { workspaceGoalRepository, unitOfWork, useCase };
}

describe('an Admin adding a Workspace Goal', () => {
  it('stores it active, with the name as written and its description, in one unit of work', async () => {
    const { workspaceGoalRepository, unitOfWork, useCase } = setUp();

    const created = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
      name: '#Ownership',
      description: ' We finish what we start. ',
    });

    expect(created).toEqual({ id: WORKSPACE_GOAL_ID });
    expect(
      workspaceGoalRepository.saved(WORKSPACE_GOAL_ID)?.snapshot(),
    ).toEqual({
      id: WORKSPACE_GOAL_ID,
      workspaceId: WORKSPACE_ID,
      name: 'Ownership',
      nameKey: 'ownership',
      description: 'We finish what we start.',
      status: 'ACTIVE',
    });
    expect(unitOfWork.opened).toHaveLength(1);
  });

  it('stores no description when none was written', async () => {
    const { workspaceGoalRepository, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
      name: 'ownership',
    });

    expect(
      workspaceGoalRepository.saved(WORKSPACE_GOAL_ID)?.snapshot().description,
    ).toBeNull();
  });

  it('is refused when the name is taken by a hidden one in another letter case', async () => {
    const { workspaceGoalRepository, useCase } = setUp(
      new FakeWorkspaceGoalRepository().with(hiddenOwnership(WORKSPACE_ID)),
    );

    await expect(
      useCase.execute({
        workspaceId: WORKSPACE_ID,
        accountId: ANN,
        name: 'OWNERSHIP',
      }),
    ).rejects.toThrow(WorkspaceGoalNameTakenError);
    expect(workspaceGoalRepository.count).toBe(1);
  });

  it('is not refused for a name another Workspace uses', async () => {
    const { workspaceGoalRepository, useCase } = setUp(
      new FakeWorkspaceGoalRepository().with(
        hiddenOwnership(OTHER_WORKSPACE_ID),
      ),
    );

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      accountId: ANN,
      name: 'ownership',
    });

    expect(workspaceGoalRepository.saved(WORKSPACE_GOAL_ID)).toBeDefined();
  });

  it('is refused for a name with a space, storing nothing', async () => {
    const { workspaceGoalRepository, useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: WORKSPACE_ID,
        accountId: ANN,
        name: 'ship it',
      }),
    ).rejects.toThrow(WorkspaceGoalNameHasSpacesError);
    expect(workspaceGoalRepository.count).toBe(0);
  });

  it('is refused to a Member who is not an Admin, storing nothing', async () => {
    const { workspaceGoalRepository, useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: WORKSPACE_ID,
        accountId: BEN,
        name: 'ownership',
      }),
    ).rejects.toThrow(NotAllowedToManageWorkspaceGoalsError);
    expect(workspaceGoalRepository.count).toBe(0);
  });
});
