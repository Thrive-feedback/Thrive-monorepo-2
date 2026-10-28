import type { components } from '@repo/api';
import type { CurrentAccount, CurrentMembership } from './current-account.type';
import type { PendingInvitation } from './pending-invitation.type';

type CurrentSessionWire =
  components['schemas']['GetCurrentSessionResponseDto_Output'];

type CurrentMembershipWire =
  components['schemas']['GetCurrentMembershipResponseDto_Output'];

type PendingInvitationsWire =
  components['schemas']['ListMyInvitationsResponseDto_Output'];

/** `null` means nobody is signed in: the API answers that rather than failing. */
export function toCurrentAccount(
  wire: CurrentSessionWire,
): CurrentAccount | null {
  if (!wire.account) {
    return null;
  }
  const { accountId, email, name, photoUrl, profile } = wire.account;
  return {
    accountId,
    email,
    name,
    photoUrl,
    profile: profile
      ? {
          fullName: profile.fullName,
          displayName: profile.displayName,
          slug: profile.slug,
        }
      : null,
  };
}

/** The session has been in use long enough that it should be pushed forward. */
export function toNeedsRefresh(wire: CurrentSessionWire): boolean {
  return wire.account !== null && wire.needsRefresh;
}

/**
 * The Workspace this browser's session is in. `null` while it is in none: the person is to choose
 * one, or join or create one if they have none.
 */
export function toCurrentMembership(
  wire: CurrentMembershipWire,
): CurrentMembership | null {
  const { membership } = wire;
  if (!membership) {
    return null;
  }
  return {
    workspace: { id: membership.workspace.id, name: membership.workspace.name },
    role: membership.role,
  };
}

/** Only what the choice of Workspace shows, with the date read as a `Date`. */
export function toPendingInvitations(
  wire: PendingInvitationsWire,
): PendingInvitation[] {
  return wire.items.map((invitation) => ({
    invitationId: invitation.invitationId,
    workspace: {
      name: invitation.workspace.name,
      memberCount: invitation.workspace.memberCount,
    },
    invitedAt: new Date(invitation.invitedAt),
  }));
}
