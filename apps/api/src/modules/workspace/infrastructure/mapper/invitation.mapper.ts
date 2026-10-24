import type {
  InvitationDetailView,
  InvitationView,
  PendingInvitationView,
} from '../../application/types/invitation.types';
import { InvitationStatus } from '../../domain/value-object/invitation-status.vo';
import {
  MemberRole,
  type MemberRoleValue,
} from '../../domain/value-object/member-role.vo';

/**
 * The only place that knows both a stored `invitation` row and an Invitation. A row with no role
 * is one the plugin wrote with its default, `member`.
 */
export function toInvitationView(
  record: {
    readonly id: string;
    readonly email: string;
    readonly role: string | null;
    readonly createdAt: Date;
    readonly expiresAt: Date;
    readonly inviterId: string;
  },
  now: Date,
): InvitationView {
  return {
    invitationId: record.id,
    email: record.email,
    role: roleOf(record.role),
    status: InvitationStatus.openAt(record.expiresAt, now),
    invitedAt: record.createdAt,
    expiresAt: record.expiresAt,
    inviterAccountId: record.inviterId,
  };
}

function roleOf(stored: string | null): MemberRoleValue {
  return MemberRole.of((stored ?? 'member').toUpperCase()).toString();
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
    readonly role: string | null;
    readonly status: string;
    readonly createdAt: Date;
    readonly expiresAt: Date;
    /** `null` until it is first resent. */
    readonly lastSentAt: Date | null;
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
    role: roleOf(record.role),
    status: statusOf(record.status, record.expiresAt, now).toString(),
    lastSentAt: record.lastSentAt ?? record.createdAt,
    expiresAt: record.expiresAt,
  };
}

export function toPendingInvitationView(record: {
  readonly id: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly workspace: {
    readonly id: string;
    readonly name: string;
    readonly _count: { readonly members: number };
  };
}): PendingInvitationView {
  return {
    invitationId: record.id,
    workspace: {
      id: record.workspace.id,
      name: record.workspace.name,
      memberCount: record.workspace._count.members,
    },
    invitedAt: record.createdAt,
    expiresAt: record.expiresAt,
  };
}
