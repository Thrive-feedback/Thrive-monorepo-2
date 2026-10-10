/** Where an Invitation nobody has accepted or revoked stands. */
export const OPEN_INVITATION_STATUSES = ['PENDING', 'EXPIRED'] as const;

export type OpenInvitationStatusValue =
  (typeof OPEN_INVITATION_STATUSES)[number];

/**
 * An open Invitation is Pending until its expiry, and Expired from that instant on. The store
 * keeps it pending either way, so the status is always worked out against "now".
 */
export class InvitationStatus {
  private constructor(private readonly value: OpenInvitationStatusValue) {}

  static at(expiresAt: Date, now: Date): InvitationStatus {
    return new InvitationStatus(
      expiresAt.getTime() <= now.getTime() ? 'EXPIRED' : 'PENDING',
    );
  }

  toString(): OpenInvitationStatusValue {
    return this.value;
  }
}
