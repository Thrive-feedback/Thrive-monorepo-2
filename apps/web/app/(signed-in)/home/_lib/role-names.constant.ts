import type { MemberRole } from '@/lib/session/current-account.type';

/** How a Role reads on screen, in the glossary's words. */
export const ROLE_NAMES: Readonly<Record<MemberRole, string>> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
};
