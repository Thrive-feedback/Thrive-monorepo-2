import type { CurrentMembership } from '@/lib/session/current-account.type';

/** Admins change anyone's Role, their own included; the API refuses everyone else. */
export function mayChangeRoles(membership: CurrentMembership): boolean {
  return membership.role === 'ADMIN';
}
