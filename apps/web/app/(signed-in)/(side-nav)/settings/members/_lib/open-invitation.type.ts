import type { components } from '@repo/api';

type OpenInvitationStatus =
  components['schemas']['ListWorkspaceInvitationsResponseDto_Output']['items'][number]['status'];

/** An Invitation nobody has accepted or revoked yet, as Members lists it. */
export type OpenInvitation = {
  readonly invitationId: string;
  readonly email: string;
  /** `PENDING` until its 7 days pass, then `EXPIRED`. */
  readonly status: OpenInvitationStatus;
  /** Who sent it: their Display name, or their address until they have introduced themselves. */
  readonly invitedBy: string;
  /** When it was first sent, as an ISO date-time. */
  readonly invitedAt: string;
  readonly expiresAt: string;
};
