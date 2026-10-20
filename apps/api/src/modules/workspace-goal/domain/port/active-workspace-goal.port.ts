/** An active Workspace Goal, as another module names it. */
export interface ActiveWorkspaceGoal {
  readonly id: string;
  /** In the Admin's spelling, without the `#`. */
  readonly name: string;
}

/**
 * Published: which of several hashtags name an active Workspace Goal of one Workspace, in one
 * call. Another module asks it when text it is about to store is written with hashtags, such as
 * Feedback binding the Workspace Goals it names.
 */
export abstract class ActiveWorkspaceGoalPort {
  /**
   * One entry per active Workspace Goal named, matched whatever the letter case, each once.
   * Hidden ones, another Workspace's and names that match nothing are left out.
   */
  abstract activeAmong(query: {
    readonly workspaceId: string;
    /** As written after the `#`. */
    readonly names: readonly string[];
  }): Promise<ActiveWorkspaceGoal[]>;
}
