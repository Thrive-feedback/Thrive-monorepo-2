/**
 * Published: whether an Account is a Member of one Workspace. Another module asks this
 * before it acts inside that Workspace — to resolve its own caller, and to refuse a request
 * that names somebody who is not in it.
 *
 * It answers facts and nothing else: Roles, names and the Members themselves stay inside
 * Workspace, which owns them.
 */
export abstract class WorkspaceMembershipPort {
  abstract isMemberOf(membership: {
    readonly workspaceId: string;
    readonly accountId: string;
  }): Promise<boolean>;

  /**
   * Which of these Accounts are Members of one Workspace, in one read however many are named —
   * for a request that names several people at once. An Account that is not a Member is
   * simply absent from the answer.
   */
  abstract membersAmong(members: {
    readonly workspaceId: string;
    readonly accountIds: readonly string[];
  }): Promise<readonly string[]>;

  /**
   * Which of these Accounts were Members of one Workspace and are Deactivated there, in one read
   * however many are named — so a screen naming them can show they are inactive. An Account that
   * is active, or was never a Member, is absent. It says nothing about any other Workspace.
   */
  abstract deactivatedAmong(members: {
    readonly workspaceId: string;
    readonly accountIds: readonly string[];
  }): Promise<readonly string[]>;
}
