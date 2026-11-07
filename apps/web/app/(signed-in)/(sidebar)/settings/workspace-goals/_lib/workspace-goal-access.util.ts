import type { CurrentMembership } from '@/lib/session/current-account.type';

/** Admins add, hide and show Workspace Goals; the API refuses everyone else. */
export function mayManageWorkspaceGoals(
  membership: CurrentMembership,
): boolean {
  return membership.role === 'ADMIN';
}
