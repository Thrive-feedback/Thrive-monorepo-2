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

  /** The Workspace's Members, oldest first, so the Owner who founded it comes first. */
  abstract membersOfWorkspace(
    workspaceId: string,
    page: PageRequest,
  ): Promise<WorkspaceMemberPage>;
}
