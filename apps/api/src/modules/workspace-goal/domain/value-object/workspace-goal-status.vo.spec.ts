import { describe, expect, it } from 'bun:test';
import {
  WorkspaceGoalAlreadyActiveError,
  WorkspaceGoalAlreadyHiddenError,
  WorkspaceGoalStatusInvalidError,
} from '../workspace-goal.errors';
import { WorkspaceGoalStatus } from './workspace-goal-status.vo';

describe("a Workspace Goal's status", () => {
  it('moves from active to hidden and back', () => {
    expect(WorkspaceGoalStatus.Active.hide().toString()).toBe('HIDDEN');
    expect(WorkspaceGoalStatus.Hidden.show().toString()).toBe('ACTIVE');
  });

  it('refuses to hide what is already hidden', () => {
    expect(() => WorkspaceGoalStatus.Hidden.hide()).toThrow(
      WorkspaceGoalAlreadyHiddenError,
    );
  });

  it('refuses to show what is already shown', () => {
    expect(() => WorkspaceGoalStatus.Active.show()).toThrow(
      WorkspaceGoalAlreadyActiveError,
    );
  });

  it('refuses a stored value it does not know', () => {
    expect(() => WorkspaceGoalStatus.of('DELETED')).toThrow(
      WorkspaceGoalStatusInvalidError,
    );
  });
});
