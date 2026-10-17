import type {
  MembershipPage,
  MembershipView,
  PageRequest,
  WorkspaceMemberPage,
} from '../types/membership.types';

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

  /** The Workspace's Members, oldest first, so the Admin who founded it comes first. */
  abstract membersOfWorkspace(
    workspaceId: string,
    page: PageRequest,
  ): Promise<WorkspaceMemberPage>;

  /**
   * How many Admins the Workspace has. Every Member is active until Deactivating exists (#192);
   * from then on, only active Admins count.
   */
  abstract adminCountOf(workspaceId: string): Promise<number>;
}
