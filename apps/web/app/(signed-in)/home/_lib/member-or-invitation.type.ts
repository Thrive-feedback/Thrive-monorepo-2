import type { components } from '@repo/api';
import type { MemberRole } from '@/lib/session/current-account.type';

type InvitationStatus =
  components['schemas']['ListWorkspaceInvitationsResponseDto_Output']['items'][number]['status'];

/** Someone in the Workspace, or invited to it, as Home lists them. */
export type MemberOrInvitation = {
  readonly email: string;
  /** The Profile name; `null` for an Invitation, or a Member who has not introduced themselves. */
  readonly name: string | null;
  readonly role: MemberRole;
  /** `JOINED` for a Member; an Invitation is `PENDING` until its 7 days pass, then `EXPIRED`. */
  readonly status: 'JOINED' | InvitationStatus;
  /** The Invitation to revoke; `null` for a Member. */
  readonly invitationId: string | null;
};
