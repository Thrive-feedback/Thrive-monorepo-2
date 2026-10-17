import type { CurrentMembership } from '@/lib/session/current-account.type';

/** Admins change anyone's Role, their own included; the API refuses everyone else. */
export function mayChangeRoles(membership: CurrentMembership): boolean {
  return membership.role === 'ADMIN';
}

/** Admins Reactivate anyone Deactivated; the API refuses everyone else. */
export function mayReactivate(membership: CurrentMembership): boolean {
  return membership.role === 'ADMIN';
}

/** Admins Deactivate anyone else, other Admins included; everyone may only leave themselves. */
export function mayDeactivateOthers(membership: CurrentMembership): boolean {
  return membership.role === 'ADMIN';
}
