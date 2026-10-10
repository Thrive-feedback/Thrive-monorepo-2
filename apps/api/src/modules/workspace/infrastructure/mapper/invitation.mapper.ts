import type { InvitationView } from '../../application/types/invitation.types';
import { InvitationStatus } from '../../domain/value-object/invitation-status.vo';
import { MemberRole } from '../../domain/value-object/member-role.vo';

/**
 * The only place that knows both a stored `invitation` row and an Invitation. A row with no role
 * is one the plugin wrote with its default, which Thrive always sets to `member`.
 */
export function toInvitationView(
  record: {
    readonly id: string;
    readonly email: string;
    readonly role: string | null;
    readonly expiresAt: Date;
  },
  now: Date,
): InvitationView {
  return {
    invitationId: record.id,
    email: record.email,
    role: MemberRole.of((record.role ?? 'member').toUpperCase()).toString(),
    status: InvitationStatus.at(record.expiresAt, now).toString(),
    expiresAt: record.expiresAt,
  };
}
