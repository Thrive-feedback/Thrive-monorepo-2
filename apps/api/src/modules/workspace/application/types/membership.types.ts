import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';

/** One of the caller's memberships, as the signed-in screens read it. */
export interface MembershipView {
  readonly workspace: { readonly id: string; readonly name: string };
  readonly role: MemberRoleValue;
}

/**
 * Whether a Member can still open their Workspace. A Deactivated one cannot, but stays on record,
 * because the Feedback they gave and received stays (glossary: Deactivate).
 */
export const MEMBER_STATUSES = ['ACTIVE', 'DEACTIVATED'] as const;

export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export interface PageRequest {
  /** 1-based. */
  readonly page: number;
  readonly pageSize: number;
}

export interface MembershipPage {
  readonly items: readonly MembershipView[];
  readonly total: number;
}

/** One Member of a Workspace, as the Workspace knows them: the Account and its Role. */
export interface WorkspaceMemberView {
  readonly accountId: string;
  readonly role: MemberRoleValue;
}

export interface WorkspaceMemberPage {
  readonly items: readonly WorkspaceMemberView[];
  readonly total: number;
}
