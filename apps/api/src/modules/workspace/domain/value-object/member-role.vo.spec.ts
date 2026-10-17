import { describe, expect, it } from 'bun:test';
import { LastAdminError, MemberRoleInvalidError } from '../workspace.errors';
import { MemberRole } from './member-role.vo';

describe('a Member role', () => {
  it('reads a stored Admin back as an Admin', () => {
    expect(MemberRole.of('ADMIN').equals(MemberRole.Admin)).toBe(true);
  });

  it('reads a stored Member back as the Role with no management rights', () => {
    expect(MemberRole.of('MEMBER').equals(MemberRole.Member)).toBe(true);
  });

  it('is refused when it is not a known Role', () => {
    expect(() => MemberRole.of('EMPEROR')).toThrow(MemberRoleInvalidError);
  });

  it('knows no Owner', () => {
    expect(() => MemberRole.of('OWNER')).toThrow(MemberRoleInvalidError);
  });
});

describe('who may invite people into a Workspace', () => {
  it('lets an Admin invite', () => {
    expect(MemberRole.Admin.mayInvite()).toBe(true);
  });

  it('does not let a Member with no management rights invite', () => {
    expect(MemberRole.Member.mayInvite()).toBe(false);
  });
});

describe('who may change Roles in a Workspace', () => {
  it('lets an Admin change Roles', () => {
    expect(MemberRole.Admin.mayChangeRoles()).toBe(true);
  });

  it('does not let a Member with no management rights change Roles', () => {
    expect(MemberRole.Member.mayChangeRoles()).toBe(false);
  });
});

describe('changing a Role', () => {
  it('lets an Admin become a Member while another Admin remains', () => {
    expect(() =>
      MemberRole.Admin.ensureMayBecome(MemberRole.Member, 2),
    ).not.toThrow();
  });

  it('refuses to make the last Admin a Member', () => {
    expect(() =>
      MemberRole.Admin.ensureMayBecome(MemberRole.Member, 1),
    ).toThrow(LastAdminError);
  });

  it('lets a Member become an Admin however few Admins there are', () => {
    expect(() =>
      MemberRole.Member.ensureMayBecome(MemberRole.Admin, 1),
    ).not.toThrow();
  });

  it('lets the last Admin stay an Admin', () => {
    expect(() =>
      MemberRole.Admin.ensureMayBecome(MemberRole.Admin, 1),
    ).not.toThrow();
  });
});

describe('who may Deactivate other people in a Workspace', () => {
  it('lets an Admin Deactivate others', () => {
    expect(MemberRole.Admin.mayDeactivateOthers()).toBe(true);
  });

  it('does not let a Member with no management rights Deactivate others', () => {
    expect(MemberRole.Member.mayDeactivateOthers()).toBe(false);
  });
});

describe('being Deactivated, or leaving', () => {
  it('lets an Admin go while another active Admin remains', () => {
    expect(() => MemberRole.Admin.ensureMayBeDeactivated(2)).not.toThrow();
  });

  it('refuses the last active Admin', () => {
    expect(() => MemberRole.Admin.ensureMayBeDeactivated(1)).toThrow(
      LastAdminError,
    );
  });

  it('lets a Member go however few Admins there are', () => {
    expect(() => MemberRole.Member.ensureMayBeDeactivated(1)).not.toThrow();
  });
});
