import { describe, expect, it } from 'bun:test';
import { MemberRoleInvalidError } from '../workspace.errors';
import { MemberRole } from './member-role.vo';

describe('a Member role', () => {
  it('reads a stored Owner back as the Owner', () => {
    expect(MemberRole.of('OWNER').equals(MemberRole.Owner)).toBe(true);
  });

  it('is refused when it is not a known Role', () => {
    expect(() => MemberRole.of('EMPEROR')).toThrow(MemberRoleInvalidError);
  });
});
