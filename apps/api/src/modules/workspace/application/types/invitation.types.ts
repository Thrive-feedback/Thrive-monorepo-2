import type {
  InvitationStatusValue,
  OpenInvitationStatusValue,
} from '../../domain/value-object/invitation-status.vo';
import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';

export interface InvitationView {
  readonly invitationId: string;
  readonly email: string;
  /** The Role the invited person will join with. */
  readonly role: MemberRoleValue;
  readonly status: OpenInvitationStatusValue;
  readonly expiresAt: Date;
}

export interface InvitationPage {
  readonly items: readonly InvitationView[];
  readonly total: number;
}

/** One Invitation as the person it was sent to meets it, whatever has become of it. */
export interface InvitationDetailView {
  readonly invitationId: string;
  readonly workspace: { readonly id: string; readonly name: string };
  readonly inviterAccountId: string;
  /** The address it was sent to, exactly as stored. */
  readonly email: string;
  readonly status: InvitationStatusValue;
}

/**
 * A Pending Invitation as the person it was sent to weighs it against the others, before they
 * belong to any Workspace.
 */
export interface PendingInvitationView {
  readonly invitationId: string;
  readonly workspace: {
    readonly id: string;
    readonly name: string;
    /** Everyone with a Membership there, the Owner included. */
    readonly memberCount: number;
  };
  /** When it was sent. Invitations are never resent yet, so this is also when it was last sent. */
  readonly invitedAt: Date;
  readonly expiresAt: Date;
}

export interface PendingInvitationPage {
  readonly items: readonly PendingInvitationView[];
  readonly total: number;
}
