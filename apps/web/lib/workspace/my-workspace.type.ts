/** One of the person's Workspaces, as the switcher shows it: its name, and nothing of their Role. */
export type MyWorkspace = {
  readonly id: string;
  readonly name: string;
};

/** The Workspaces the person can open, and those they were Deactivated in. */
export type MyWorkspaces = {
  /** The one they are in first, then the rest from the one they used most recently. */
  readonly active: readonly MyWorkspace[];
  readonly inactive: readonly MyWorkspace[];
};
