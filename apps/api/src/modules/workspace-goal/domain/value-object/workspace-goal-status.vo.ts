import {
  WorkspaceGoalAlreadyActiveError,
  WorkspaceGoalAlreadyHiddenError,
  WorkspaceGoalStatusInvalidError,
} from '../workspace-goal.errors';

export const WORKSPACE_GOAL_STATUSES = ['ACTIVE', 'HIDDEN'] as const;

export type WorkspaceGoalStatusValue = (typeof WORKSPACE_GOAL_STATUSES)[number];

function isWorkspaceGoalStatus(raw: string): raw is WorkspaceGoalStatusValue {
  return (WORKSPACE_GOAL_STATUSES as readonly string[]).includes(raw);
}

/**
 * Whether Members can see and write a Workspace Goal. It moves between the two and nowhere
 * else: there is no deleted state, because Feedback that used a hidden one stays bound to it
 * (`ADR-0036`).
 */
export class WorkspaceGoalStatus {
  static readonly Active = new WorkspaceGoalStatus('ACTIVE');
  static readonly Hidden = new WorkspaceGoalStatus('HIDDEN');

  private constructor(private readonly value: WorkspaceGoalStatusValue) {}

  static of(raw: string): WorkspaceGoalStatus {
    if (!isWorkspaceGoalStatus(raw)) {
      throw new WorkspaceGoalStatusInvalidError();
    }
    return raw === 'ACTIVE'
      ? WorkspaceGoalStatus.Active
      : WorkspaceGoalStatus.Hidden;
  }

  hide(): WorkspaceGoalStatus {
    if (this.equals(WorkspaceGoalStatus.Hidden)) {
      throw new WorkspaceGoalAlreadyHiddenError();
    }
    return WorkspaceGoalStatus.Hidden;
  }

  show(): WorkspaceGoalStatus {
    if (this.equals(WorkspaceGoalStatus.Active)) {
      throw new WorkspaceGoalAlreadyActiveError();
    }
    return WorkspaceGoalStatus.Active;
  }

  equals(other: WorkspaceGoalStatus): boolean {
    return this.value === other.value;
  }

  toString(): WorkspaceGoalStatusValue {
    return this.value;
  }
}
