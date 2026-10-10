import { MemberRoleInvalidError } from '../workspace.errors';

export const MEMBER_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;

export type MemberRoleValue = (typeof MEMBER_ROLES)[number];

function isMemberRole(raw: string): raw is MemberRoleValue {
  return (MEMBER_ROLES as readonly string[]).includes(raw);
}

/**
 * What a Member is allowed to manage in their Workspace. `MEMBER` is the Role with no
 * management rights: every Owner and Admin is a Member too, but only these hold the Role.
 */
export class MemberRole {
  static readonly Owner = new MemberRole('OWNER');
  static readonly Admin = new MemberRole('ADMIN');
  static readonly Member = new MemberRole('MEMBER');

  private constructor(private readonly value: MemberRoleValue) {}

  static of(raw: string): MemberRole {
    if (!isMemberRole(raw)) {
      throw new MemberRoleInvalidError();
    }
    return new MemberRole(raw);
  }

  /** Owner and Admins invite people into the Workspace; a Member with no rights cannot. */
  mayInvite(): boolean {
    return this.value === 'OWNER' || this.value === 'ADMIN';
  }

  equals(other: MemberRole): boolean {
    return this.value === other.value;
  }

  toString(): MemberRoleValue {
    return this.value;
  }
}
