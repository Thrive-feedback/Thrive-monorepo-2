import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';

export interface MemberRoleChange {
  /** The changer's `cookie` header, opaque to everyone but the adapter. */
  readonly credential: string;
  readonly workspaceId: string;
  /** The Account whose Role in the Workspace changes. */
  readonly accountId: string;
  readonly role: MemberRoleValue;
}

/**
 * Stores a Member's new Role, as the signed-in changer, who must be allowed to change Roles
 * there. The caller has already checked the change keeps the Workspace an Admin.
 */
export abstract class MemberRoleChanging {
  abstract change(change: MemberRoleChange): Promise<void>;
}
