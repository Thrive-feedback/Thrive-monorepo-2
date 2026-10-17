import { LastAdminError, MemberRoleInvalidError } from '../workspace.errors';

export const MEMBER_ROLES = ['ADMIN', 'MEMBER'] as const;

export type MemberRoleValue = (typeof MEMBER_ROLES)[number];

function isMemberRole(raw: string): raw is MemberRoleValue {
  return (MEMBER_ROLES as readonly string[]).includes(raw);
}

/**
 * What a Member is allowed to manage in their Workspace. `MEMBER` is the Role with no
 * management rights: every Admin is a Member too, but only Admins hold the other Role. There is
 * no Owner, and every Admin has the same powers (brain `ADR-0033`).
 */
export class MemberRole {
  static readonly Admin = new MemberRole('ADMIN');
  static readonly Member = new MemberRole('MEMBER');

  private constructor(private readonly value: MemberRoleValue) {}

  static of(raw: string): MemberRole {
    if (!isMemberRole(raw)) {
      throw new MemberRoleInvalidError();
    }
    return new MemberRole(raw);
  }

  /** Admins invite people into the Workspace; a Member with no rights cannot. */
  mayInvite(): boolean {
    return this.value === 'ADMIN';
  }

  /** Admins change anyone's Role, other Admins' and their own included. */
  mayChangeRoles(): boolean {
    return this.value === 'ADMIN';
  }

  /**
   * Refuses to make the Workspace's last Admin a Member, so it is never left with nobody to
   * manage it. `adminCount` is how many Admins the Workspace has now, this one included.
   */
  ensureMayBecome(next: MemberRole, adminCount: number): void {
    if (
      this.equals(MemberRole.Admin) &&
      next.equals(MemberRole.Member) &&
      adminCount <= 1
    ) {
      throw new LastAdminError();
    }
  }

  equals(other: MemberRole): boolean {
    return this.value === other.value;
  }

  toString(): MemberRoleValue {
    return this.value;
  }
}
