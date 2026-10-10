import { describe, expect, it } from 'bun:test';
import {
  NoAddressesToInviteError,
  TooManyInvitationsError,
} from '../workspace.errors';
import { InvitedAddresses } from './invited-addresses.vo';

function addresses(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `person${index}@acme.co`);
}

describe('the addresses one send invites', () => {
  it('keeps them in the order they were given', () => {
    expect(InvitedAddresses.of(['b@acme.co', 'a@acme.co']).toArray()).toEqual([
      'b@acme.co',
      'a@acme.co',
    ]);
  });

  it('treats one mailbox written two ways as one person', () => {
    expect(
      InvitedAddresses.of(['Ann@Acme.co', ' ann@acme.co ']).toArray(),
    ).toEqual(['ann@acme.co']);
  });

  it('is refused when it names nobody', () => {
    expect(() => InvitedAddresses.of([])).toThrow(NoAddressesToInviteError);
  });

  it('allows ten people at once', () => {
    expect(InvitedAddresses.of(addresses(10)).toArray()).toHaveLength(10);
  });

  it('is refused at eleven people', () => {
    expect(() => InvitedAddresses.of(addresses(11))).toThrow(
      TooManyInvitationsError,
    );
  });

  it('counts people after merging, so eleven rows naming ten people are allowed', () => {
    expect(
      InvitedAddresses.of([...addresses(10), 'PERSON0@acme.co']).toArray(),
    ).toHaveLength(10);
  });
});
