import { describe, expect, it } from 'bun:test';
import { WorkspaceGoalDescription } from '../value-object/workspace-goal-description.vo';
import { WorkspaceGoalName } from '../value-object/workspace-goal-name.vo';
import { WorkspaceGoalAlreadyHiddenError } from '../workspace-goal.errors';
import { WorkspaceGoal } from './workspace-goal.entity';

function aWorkspaceGoal(): WorkspaceGoal {
  return WorkspaceGoal.create({
    id: 'workspace-goal-1',
    workspaceId: 'workspace-1',
    name: WorkspaceGoalName.of('Ownership'),
    description: WorkspaceGoalDescription.of('We finish what we start.'),
  });
}

describe('a Workspace Goal', () => {
  it('is active from the moment an Admin creates it, keyed by its name in any case', () => {
    expect(aWorkspaceGoal().snapshot()).toEqual({
      id: 'workspace-goal-1',
      workspaceId: 'workspace-1',
      name: 'Ownership',
      nameKey: 'ownership',
      description: 'We finish what we start.',
      status: 'ACTIVE',
    });
  });

  it('keeps its name and description when hidden and shown again', () => {
    const workspaceGoal = aWorkspaceGoal();

    workspaceGoal.hide();
    workspaceGoal.show();

    expect(workspaceGoal.snapshot()).toEqual(aWorkspaceGoal().snapshot());
  });

  it('cannot be hidden twice', () => {
    const workspaceGoal = aWorkspaceGoal();
    workspaceGoal.hide();

    expect(() => workspaceGoal.hide()).toThrow(WorkspaceGoalAlreadyHiddenError);
  });
});
