/**
 * Published: whether an Account is a Member of one Workspace. Another module asks this
 * before it acts inside that Workspace — to resolve its own caller, and to refuse a request
 * that names somebody who is not in it.
 *
 * It answers a fact and nothing else: Roles, names and the Members themselves stay inside
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
}
