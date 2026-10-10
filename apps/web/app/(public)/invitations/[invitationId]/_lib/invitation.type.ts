import type { components } from '@repo/api';

export type InvitationStatus =
  components['schemas']['GetInvitationResponseDto_Output']['status'];

/** Where an Invitation stands once it can no longer be accepted. */
export type ClosedInvitationStatus = Exclude<InvitationStatus, 'PENDING'>;

/** An Invitation as its link shows it, to anyone holding the link. */
export type Invitation = {
  readonly invitationId: string;
  readonly workspaceName: string;
  /** `null` while the inviter has not introduced themselves. */
  readonly inviterName: string | null;
  /** Only enough of the invited address for its owner to recognise it. */
  readonly invitedEmailMasked: string;
  readonly status: InvitationStatus;
};
