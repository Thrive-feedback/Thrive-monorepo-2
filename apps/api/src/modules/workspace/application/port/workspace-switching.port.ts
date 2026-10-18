export interface WorkspaceSwitch {
  readonly workspaceId: string;
  /** The Account that is now in this Workspace. */
  readonly accountId: string;
  readonly switchedAt: Date;
}

/**
 * Records when the Account last went into a Workspace, so lists of their Workspaces put the one
 * used last first. Which Workspace a session is in is `SessionWorkspace`'s. The caller has already
 * checked they are an active Member there.
 */
export abstract class WorkspaceSwitching {
  abstract switchTo(workspaceSwitch: WorkspaceSwitch): Promise<void>;
}
