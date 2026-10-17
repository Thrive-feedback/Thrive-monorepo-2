import { describe, expect, it } from 'bun:test';
import {
  MemberRoleInvalidError,
  NoAddressesToInviteError,
  TooManyInvitationsError,
} from '../workspace.errors';
import { InvitedAddresses } from './invited-addresses.vo';
import { MemberRole } from './member-role.vo';

function asMembers(...emails: string[]) {
  return emails.map((email) => ({ email, role: 'MEMBER' }));
}

function people(count: number) {
  return asMembers(
    ...Array.from({ length: count }, (_, index) => `person${index}@acme.co`),
  );
}

function emailsOf(addresses: InvitedAddresses) {
  return addresses.toArray().map((invitee) => invitee.email);
}

describe('the addresses one send invites', () => {
  it('keeps them in the order they were given', () => {
    expect(
      emailsOf(InvitedAddresses.of(asMembers('b@acme.co', 'a@acme.co'))),
    ).toEqual(['b@acme.co', 'a@acme.co']);
  });

  it('treats one mailbox written two ways as one person', () => {
    expect(
      emailsOf(InvitedAddresses.of(asMembers('Ann@Acme.co', ' ann@acme.co '))),
    ).toEqual(['ann@acme.co']);
  });

  it('is refused when it names nobody', () => {
    expect(() => InvitedAddresses.of([])).toThrow(NoAddressesToInviteError);
  });

  it('allows ten people at once', () => {
    expect(InvitedAddresses.of(people(10)).toArray()).toHaveLength(10);
  });

  it('is refused at eleven people', () => {
    expect(() => InvitedAddresses.of(people(11))).toThrow(
      TooManyInvitationsError,
    );
  });

  it('counts people after merging, so eleven rows naming ten people are allowed', () => {
    expect(
      InvitedAddresses.of([
        ...people(10),
        ...asMembers('PERSON0@acme.co'),
      ]).toArray(),
    ).toHaveLength(10);
  });
});

describe('the Role each person is invited with', () => {
  it('keeps the Role chosen for each person', () => {
    const [ann, ben] = InvitedAddresses.of([
      { email: 'ann@acme.co', role: 'MEMBER' },
      { email: 'ben@acme.co', role: 'ADMIN' },
    ]).toArray();

    expect(ann?.role.equals(MemberRole.Member)).toBe(true);
    expect(ben?.role.equals(MemberRole.Admin)).toBe(true);
  });

  it('takes the Role from the first time a person is named', () => {
    const [ann] = InvitedAddresses.of([
      { email: 'ann@acme.co', role: 'ADMIN' },
      { email: 'Ann@Acme.co', role: 'MEMBER' },
    ]).toArray();

    expect(ann?.role.equals(MemberRole.Admin)).toBe(true);
  });

  it('is refused when a Role is not one of the known Roles', () => {
    expect(() =>
      InvitedAddresses.of([{ email: 'ann@acme.co', role: 'OWNER' }]),
    ).toThrow(MemberRoleInvalidError);
  });
});
