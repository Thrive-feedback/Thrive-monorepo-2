import type {
  InvitationDetailView,
  InvitationView,
} from '../../application/types/invitation.types';
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
    status: InvitationStatus.openAt(record.expiresAt, now),
    expiresAt: record.expiresAt,
  };
}

/**
 * The plugin's lowercase statuses as Thrive's. `rejected` is the plugin's word for an invitee
 * declining, which Thrive offers nobody, so it reads as revoked: either way it is closed.
 */
function statusOf(
  stored: string,
  expiresAt: Date,
  now: Date,
): InvitationStatus {
  if (stored === 'accepted') {
    return InvitationStatus.Accepted;
  }
  if (stored === 'canceled' || stored === 'rejected') {
    return InvitationStatus.Revoked;
  }
  return InvitationStatus.at(expiresAt, now);
}

export function toInvitationDetailView(
  record: {
    readonly id: string;
    readonly email: string;
    readonly status: string;
    readonly expiresAt: Date;
    readonly inviterId: string;
    readonly workspace: { readonly id: string; readonly name: string };
  },
  now: Date,
): InvitationDetailView {
  return {
    invitationId: record.id,
    workspace: { id: record.workspace.id, name: record.workspace.name },
    inviterAccountId: record.inviterId,
    email: record.email,
    status: statusOf(record.status, record.expiresAt, now).toString(),
  };
}
