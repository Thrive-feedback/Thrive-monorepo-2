import type { MemberRole } from '@/lib/session/current-account.type';

/** One person as their Profile shows them inside the Workspace it was opened in. */
export type Profile = {
  readonly accountId: string;
  readonly slug: string;
  /** The name they go by: their display name. */
  readonly name: string;
  readonly fullName: string;
  readonly email: string;
  /** Their Google photo, or `null` when they have none. */
  readonly photoUrl: string | null;
  readonly role: MemberRole;
  /** They were in the Workspace and are no longer; what was written to them stays. */
  readonly isDeactivated: boolean;
  /** When they joined the Workspace, as an ISO date-time. */
  readonly joinedAt: string;
};
