import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';

/** One of the caller's memberships, as the signed-in screens read it. */
export interface MembershipView {
  readonly workspace: { readonly id: string; readonly name: string };
  readonly role: MemberRoleValue;
}

export interface PageRequest {
  /** 1-based. */
  readonly page: number;
  readonly pageSize: number;
}

export interface MembershipPage {
  readonly items: readonly MembershipView[];
  readonly total: number;
}
