import type { OpenInvitationStatusValue } from '../../domain/value-object/invitation-status.vo';
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
