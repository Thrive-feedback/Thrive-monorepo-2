import { describe, expect, it } from 'bun:test';
import { InvitationNotForYouError } from '../workspace.errors';
import { InvitationRecipient } from './invitation-recipient.vo';

describe('who may accept an Invitation', () => {
  it('lets in the Account signed in with the invited address', () => {
    expect(() =>
      InvitationRecipient.of('somchai@acme.co').ensureIs('somchai@acme.co'),
    ).not.toThrow();
  });

  it('ignores case and surrounding spaces on either side', () => {
    expect(() =>
      InvitationRecipient.of(' Somchai@Acme.co').ensureIs('SOMCHAI@acme.CO '),
    ).not.toThrow();
  });

  it('refuses an Account signed in with another address', () => {
    expect(() =>
      InvitationRecipient.of('somchai@acme.co').ensureIs('nok@acme.co'),
    ).toThrow(InvitationNotForYouError);
  });

  it('refuses a Gmail alias of the invited address, since only what was typed counts', () => {
    expect(() =>
      InvitationRecipient.of('somchai@gmail.com').ensureIs(
        'som.chai+work@gmail.com',
      ),
    ).toThrow(InvitationNotForYouError);
  });
});

describe('the invited address shown to whoever holds the link', () => {
  it('keeps the first letter and the domain, and hides the rest', () => {
    expect(InvitationRecipient.of('Somchai@acme.co').masked()).toBe(
      's•••@acme.co',
    );
  });

  it('hides how long the name is', () => {
    expect(InvitationRecipient.of('jo@acme.co').masked()).toBe(
      InvitationRecipient.of('jonathan@acme.co').masked(),
    );
  });
});
