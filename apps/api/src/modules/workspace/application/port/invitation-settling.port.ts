/**
 * Settles a Pending Invitation as accepted without adding anyone, for someone already in its
 * Workspace by another way, such as an Admin's Reactivate. One already settled is left as it is.
 */
export abstract class InvitationSettling {
  abstract settleAccepted(invitationId: string): Promise<void>;
}
