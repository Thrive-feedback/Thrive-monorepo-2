import type { MemberRole } from '@/lib/session/current-account.type';

/** Someone in the Workspace, as Members lists them. */
export type WorkspaceMember = {
  readonly accountId: string;
  readonly email: string;
  /** The Display name; `null` until they have introduced themselves. */
  readonly name: string | null;
  /** The name they introduced themselves with; `null` until they have. */
  readonly fullName: string | null;
  /** The slug their Profile is opened by; `null` until they have introduced themselves. */
  readonly slug: string | null;
  /** When they joined the Workspace, as an ISO date-time. */
  readonly joinedAt: string;
  /** Their photo from Google; `null` when Google has none. */
  readonly photoUrl: string | null;
  readonly role: MemberRole;
};
