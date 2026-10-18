import type {
  MembershipView,
  WorkspaceMemberView,
} from '../../application/types/membership.types';
import {
  MemberRole,
  type MemberRoleValue,
} from '../../domain/value-object/member-role.vo';

/**
 * The only place that knows both a stored `member` row and a Membership. The organization
 * plugin stores a Role by its own lowercase name (`admin`); the contract names it `ADMIN`.
 */
export function toMembershipView(record: {
  readonly role: string;
  readonly workspace: { readonly id: string; readonly name: string };
}): MembershipView {
  return {
    workspace: { id: record.workspace.id, name: record.workspace.name },
    role: MemberRole.of(record.role.toUpperCase()).toString(),
  };
}

/** A stored `member` row as one Member of a Workspace; `userId` is the plugin's name for the Account. */
export function toWorkspaceMemberView(record: {
  readonly userId: string;
  readonly role: string;
}): WorkspaceMemberView {
  return {
    accountId: record.userId,
    role: MemberRole.of(record.role.toUpperCase()).toString(),
  };
}

/** The plugin stores a Role by its own lowercase name. */
const STORED_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const satisfies Record<MemberRoleValue, string>;

/** A Role as the plugin stores it, on a `member` row or an Invitation. */
export function toStoredRole(
  role: MemberRoleValue,
): (typeof STORED_ROLES)[MemberRoleValue] {
  return STORED_ROLES[role];
}
