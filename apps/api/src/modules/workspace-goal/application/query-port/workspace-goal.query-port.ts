import type {
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
}
