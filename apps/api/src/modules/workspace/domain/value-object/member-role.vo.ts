import { MemberRoleInvalidError } from '../workspace.errors';

/** Only the Owner exists so far; Admin and Standard arrive with the cards that grant them. */
export const MEMBER_ROLES = ['OWNER'] as const;

export type MemberRoleValue = (typeof MEMBER_ROLES)[number];

function isMemberRole(raw: string): raw is MemberRoleValue {
  return (MEMBER_ROLES as readonly string[]).includes(raw);
}

/** What a Member is allowed to manage in their Workspace. */
export class MemberRole {
  static readonly Owner = new MemberRole('OWNER');

  private constructor(private readonly value: MemberRoleValue) {}

  static of(raw: string): MemberRole {
    if (!isMemberRole(raw)) {
      throw new MemberRoleInvalidError();
    }
    return new MemberRole(raw);
  }

  equals(other: MemberRole): boolean {
    return this.value === other.value;
  }

  toString(): MemberRoleValue {
    return this.value;
  }
}
