import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';

export interface MemberRejoin {
  readonly invitationId: string;
  readonly workspaceId: string;
  /** The Account Deactivated in the Workspace, who accepts the Invitation. */
  readonly accountId: string;
  /** The Role the Invitation names, which replaces the one they had. */
  readonly role: MemberRoleValue;
}

/**
 * Accepts an Invitation for someone Deactivated in its Workspace: their kept membership comes
 * back with the Invitation's Role, rather than a second one being made (brain `ADR-0034`
 * decision 8). The caller has already checked the Invitation is theirs and still Pending.
 */
export abstract class MemberRejoining {
  abstract rejoin(rejoin: MemberRejoin): Promise<void>;
}
