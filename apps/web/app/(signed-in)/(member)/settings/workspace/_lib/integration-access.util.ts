import type { CurrentMembership } from '@/lib/session/current-account.type';

/**
 * Admins connect a chat tool and change which channel it posts in; the API refuses everyone
 * else, so this only decides what is worth showing (`GEN_09` R2).
 */
export function mayManageIntegrations(membership: CurrentMembership): boolean {
  return membership.role === 'ADMIN';
}
