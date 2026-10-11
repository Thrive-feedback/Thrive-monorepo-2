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
}
