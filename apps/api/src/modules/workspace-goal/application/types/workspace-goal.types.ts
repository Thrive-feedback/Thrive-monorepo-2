import type { WorkspaceGoalStatusValue } from '../../domain/value-object/workspace-goal-status.vo';

/** One Workspace Goal as Settings lists it. */
export interface WorkspaceGoalView {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: WorkspaceGoalStatusValue;
}

/** An active Workspace Goal, as text written with its hashtag is bound to it. */
export interface ActiveWorkspaceGoalView {
  readonly id: string;
  readonly name: string;
}

export interface PageRequest {
  /** 1-based. */
  readonly page: number;
  readonly pageSize: number;
}

export interface WorkspaceGoalPage {
  readonly items: readonly WorkspaceGoalView[];
  readonly total: number;
}
