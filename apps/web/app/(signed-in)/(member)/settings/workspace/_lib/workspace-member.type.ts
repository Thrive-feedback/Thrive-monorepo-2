import type { MemberRole } from '@/lib/session/current-account.type';

/** Someone in the Workspace, as Members lists them. */
export type WorkspaceMember = {
  readonly accountId: string;
  readonly email: string;
  /** The Display name; `null` until they have introduced themselves. */
  readonly name: string | null;
  /** Their photo from Google; `null` when Google has none. */
  readonly photoUrl: string | null;
  readonly role: MemberRole;
};
