export interface InvitationRequest {
  /** The inviter's `cookie` header, opaque to everyone but the adapter. */
  readonly credential: string;
  readonly workspaceId: string;
  /** Already trimmed and lowercased. */
  readonly email: string;
}

/** What happened to one address. Only `invited` stored anything. */
export type InvitationStored =
  | {
      readonly outcome: 'invited';
      readonly invitationId: string;
      readonly expiresAt: Date;
    }
  | { readonly outcome: 'already_member' }
  | { readonly outcome: 'already_invited' };

export interface InvitationRevocation {
  readonly credential: string;
  readonly invitationId: string;
}

export interface InvitationAcceptance {
  /** The invited person's `cookie` header: they accept on their own session. */
  readonly credential: string;
  readonly invitationId: string;
}

/**
 * Stores Invitations to a Workspace as the signed-in inviter, who must be allowed to invite
 * there. Sends nothing: delivering the Invitation is the caller's.
 */
export abstract class WorkspaceInviting {
  /** A Pending Invitation for the address, unless it is already a Member or already invited. */
  abstract invite(request: InvitationRequest): Promise<InvitationStored>;

  /**
   * Makes the signed-in person a Member of the Invitation's Workspace with the Role it names,
   * and settles the Invitation as accepted. The caller has already checked it may be accepted.
   */
  abstract accept(acceptance: InvitationAcceptance): Promise<void>;

  /** Revokes a Pending Invitation, so it can never be accepted. */
  abstract revoke(revocation: InvitationRevocation): Promise<void>;
}
