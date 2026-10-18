export interface WorkspaceSwitch {
  readonly workspaceId: string;
  /** The Account that is now in this Workspace. */
  readonly accountId: string;
  readonly switchedAt: Date;
}

/**
 * Makes a Workspace the one the Account is in: the last used, which every device opens until
 * they switch again (brain `ADR-0034` decision 2). The caller has already checked they are an
 * active Member there.
 */
export abstract class WorkspaceSwitching {
  abstract switchTo(workspaceSwitch: WorkspaceSwitch): Promise<void>;
}
