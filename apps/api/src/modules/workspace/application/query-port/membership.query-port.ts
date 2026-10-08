import type { MembershipPage, PageRequest } from '../types/membership.types';

export abstract class MembershipQuery {
  /** The Account's memberships, oldest first. Empty while it belongs to no Workspace. */
  abstract membershipsOfAccount(
    accountId: string,
    page: PageRequest,
  ): Promise<MembershipPage>;
}
