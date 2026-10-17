import { describe, expect, it } from 'vitest';
import {
  checkInviteEmail,
  checkInviteEmails,
  INVITE_EMAIL_MESSAGES,
} from './invite-emails.util';

/** Rows inviting each address as a Member. */
function members(...values: string[]) {
  return values.map((value) => ({ value, role: 'MEMBER' as const }));
}

describe('checkInviteEmails', () => {
  it('ignores empty rows and trims the rest', () => {
    expect(checkInviteEmails(members('', ' pepper@stark.com ', '   '))).toEqual(
      {
        ok: true,
        invitations: [{ email: 'pepper@stark.com', role: 'MEMBER' }],
      },
    );
  });

  it('merges duplicates regardless of case, keeping the first spelling and its Role', () => {
    expect(
      checkInviteEmails([
        { value: 'Pepper@Stark.com', role: 'ADMIN' },
        { value: 'happy@stark.com', role: 'MEMBER' },
        { value: 'pepper@stark.com', role: 'MEMBER' },
      ]),
    ).toEqual({
      ok: true,
      invitations: [
        { email: 'Pepper@Stark.com', role: 'ADMIN' },
        { email: 'happy@stark.com', role: 'MEMBER' },
      ],
    });
  });

  it.each(['pepper', 'pepper@stark', 'pepper stark@stark.com', '@stark.com'])(
    'flags %s as malformed under its own row',
    (malformed) => {
      expect(checkInviteEmails(members('happy@stark.com', malformed))).toEqual({
        ok: false,
        errors: [undefined, INVITE_EMAIL_MESSAGES.malformed],
      });
    },
  );

  it('accepts a personal Gmail address, since any Google account can sign in', () => {
    expect(checkInviteEmails(members('tony@gmail.com'))).toEqual({
      ok: true,
      invitations: [{ email: 'tony@gmail.com', role: 'MEMBER' }],
    });
  });
});

describe('checkInviteEmail', () => {
  it('passes an empty row and a company address', () => {
    expect(checkInviteEmail('  ')).toBeUndefined();
    expect(checkInviteEmail(' pepper@stark.com ')).toBeUndefined();
  });

  it('flags a malformed address', () => {
    expect(checkInviteEmail('pepper@')).toBe(INVITE_EMAIL_MESSAGES.malformed);
  });
});
