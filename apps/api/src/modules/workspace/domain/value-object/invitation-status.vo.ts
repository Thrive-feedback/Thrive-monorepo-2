import {
  InvitationAlreadyAcceptedError,
  InvitationExpiredError,
  InvitationRevokedError,
} from '../workspace.errors';

/** Where an Invitation nobody has accepted or revoked stands. */
export const OPEN_INVITATION_STATUSES = ['PENDING', 'EXPIRED'] as const;

/** Every place an Invitation can stand: open, or settled by accepting or revoking it. */
export const INVITATION_STATUSES = [
  ...OPEN_INVITATION_STATUSES,
  'ACCEPTED',
  'REVOKED',
] as const;

export type OpenInvitationStatusValue =
  (typeof OPEN_INVITATION_STATUSES)[number];

export type InvitationStatusValue = (typeof INVITATION_STATUSES)[number];

/**
 * An open Invitation is Pending until its expiry, and Expired from that instant on. The store
 * keeps it pending either way, so an open status is always worked out against "now". Accepting
 * or revoking it settles it for good.
 */
export class InvitationStatus {
  static readonly Accepted = new InvitationStatus('ACCEPTED');
  static readonly Revoked = new InvitationStatus('REVOKED');

  private constructor(private readonly value: InvitationStatusValue) {}

  /** A status read back from where it was worked out, such as a query's answer. */
  static of(value: InvitationStatusValue): InvitationStatus {
    return new InvitationStatus(value);
  }

  /** The status of an Invitation nobody has accepted or revoked yet. */
  static at(expiresAt: Date, now: Date): InvitationStatus {
    return new InvitationStatus(InvitationStatus.openAt(expiresAt, now));
  }

  /** `at`, for a reader that only ever sees open Invitations and wants the narrower value. */
  static openAt(expiresAt: Date, now: Date): OpenInvitationStatusValue {
    return expiresAt.getTime() <= now.getTime() ? 'EXPIRED' : 'PENDING';
  }

  /** Only a Pending Invitation can be accepted; the error names why any other cannot. */
  ensureAcceptable(): void {
    this.ensureOpen();
    if (this.value === 'EXPIRED') {
      throw new InvitationExpiredError();
    }
  }

  /**
   * An open Invitation can be revoked, Expired included, so an inviter can clear one away.
   * One already settled cannot.
   */
  ensureRevocable(): void {
    this.ensureOpen();
  }

  toString(): InvitationStatusValue {
    return this.value;
  }

  private ensureOpen(): void {
    if (this.value === 'ACCEPTED') {
      throw new InvitationAlreadyAcceptedError();
    }
    if (this.value === 'REVOKED') {
      throw new InvitationRevokedError();
    }
  }
}
