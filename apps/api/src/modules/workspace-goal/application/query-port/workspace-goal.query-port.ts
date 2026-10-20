import type {
  ActiveWorkspaceGoalView,
  PageRequest,
  WorkspaceGoalPage,
} from '../types/workspace-goal.types';

export abstract class WorkspaceGoalQuery {
  /**
   * One Workspace's Workspace Goals in alphabetical order, ignoring letter case — the active
   * ones only, unless `includeHidden`. Nothing of any other Workspace is ever answered.
   */
  abstract listInWorkspace(
    workspaceId: string,
    options: { readonly includeHidden: boolean },
    page: PageRequest,
  ): Promise<WorkspaceGoalPage>;

  /** The active Workspace Goals of one Workspace whose `nameKey` is among `nameKeys`, by name. */
  abstract activeWithKeys(
    workspaceId: string,
    nameKeys: readonly string[],
  ): Promise<ActiveWorkspaceGoalView[]>;
}
