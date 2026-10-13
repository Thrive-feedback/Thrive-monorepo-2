import type { CurrentMembership } from '@/lib/session/current-account.type';

/** The Owner and Admins see the open Invitations and act on them; the API refuses everyone else. */
export function mayManageInvitations(membership: CurrentMembership): boolean {
  return membership.role === 'OWNER' || membership.role === 'ADMIN';
}
