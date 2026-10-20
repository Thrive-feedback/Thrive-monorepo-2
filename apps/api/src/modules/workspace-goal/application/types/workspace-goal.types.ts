import type { WorkspaceGoalStatusValue } from '../../domain/value-object/workspace-goal-status.vo';

/** One Workspace Goal as Settings lists it. */
export interface WorkspaceGoalView {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: WorkspaceGoalStatusValue;
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
