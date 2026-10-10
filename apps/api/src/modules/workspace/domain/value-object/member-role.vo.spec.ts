import { describe, expect, it } from 'bun:test';
import { MemberRoleInvalidError } from '../workspace.errors';
import { MemberRole } from './member-role.vo';

describe('a Member role', () => {
  it('reads a stored Owner back as the Owner', () => {
    expect(MemberRole.of('OWNER').equals(MemberRole.Owner)).toBe(true);
  });

  it('reads a stored Admin back as an Admin', () => {
    expect(MemberRole.of('ADMIN').equals(MemberRole.Admin)).toBe(true);
  });

  it('reads a stored Member back as the Role with no management rights', () => {
    expect(MemberRole.of('MEMBER').equals(MemberRole.Member)).toBe(true);
  });

  it('is refused when it is not a known Role', () => {
    expect(() => MemberRole.of('EMPEROR')).toThrow(MemberRoleInvalidError);
  });
});

describe('who may invite people into a Workspace', () => {
  it('lets the Owner invite', () => {
    expect(MemberRole.Owner.mayInvite()).toBe(true);
  });

  it('lets an Admin invite', () => {
    expect(MemberRole.Admin.mayInvite()).toBe(true);
  });

  it('does not let a Member with no management rights invite', () => {
    expect(MemberRole.Member.mayInvite()).toBe(false);
  });
});
