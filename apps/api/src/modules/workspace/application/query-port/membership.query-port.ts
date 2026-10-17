import type {
  MemberStatus,
  MembershipPage,
  MembershipView,
  PageRequest,
  WorkspaceMemberPage,
} from '../types/membership.types';

/**
 * Every answer but `membersOfWorkspace` with `DEACTIVATED`, `deactivatedAmong` and `isDeactivatedIn`, is about active
 * Members only: a Deactivated person is no longer in the Workspace for anything they or others
 * do there.
 */
export abstract class MembershipQuery {
  /** The Account's memberships, oldest first. Empty while it belongs to no Workspace. */
  abstract membershipsOfAccount(
    accountId: string,
    page: PageRequest,
  ): Promise<MembershipPage>;

  /** The Account's membership of one Workspace, or `null` when it is not a Member there. */
  abstract membershipInWorkspace(
    accountId: string,
    workspaceId: string,
  ): Promise<MembershipView | null>;

  /** The Accounts among `accountIds` that are Members of the Workspace, in no set order. */
  abstract membersAmong(
    workspaceId: string,
    accountIds: readonly string[],
  ): Promise<readonly string[]>;

  /** The Accounts among `accountIds` that are Deactivated in the Workspace, in no set order. */
  abstract deactivatedAmong(
    workspaceId: string,
    accountIds: readonly string[],
  ): Promise<readonly string[]>;

  /**
   * The Workspace's Members in one status, oldest first, so the Admin who founded it comes
   * first among the active ones.
   */
  abstract membersOfWorkspace(
    workspaceId: string,
    page: PageRequest,
    status: MemberStatus,
  ): Promise<WorkspaceMemberPage>;

  /** How many active Admins the Workspace has. */
  abstract adminCountOf(workspaceId: string): Promise<number>;

  /** Whether the Account was a Member of the Workspace and has been Deactivated there. */
  abstract isDeactivatedIn(
    accountId: string,
    workspaceId: string,
  ): Promise<boolean>;
}
