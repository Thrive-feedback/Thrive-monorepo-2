import { describe, expect, it } from 'vitest';
import {
  checkInviteEmail,
  checkInviteEmails,
  INVITE_EMAIL_MESSAGES,
} from './invite-emails.util';

describe('checkInviteEmails', () => {
  it('ignores empty rows and trims the rest', () => {
    expect(checkInviteEmails(['', ' pepper@stark.com ', '   '])).toEqual({
      ok: true,
      emails: ['pepper@stark.com'],
    });
  });

  it('merges duplicates regardless of case, keeping the first spelling', () => {
    expect(
      checkInviteEmails([
        'Pepper@Stark.com',
        'happy@stark.com',
        'pepper@stark.com',
      ]),
    ).toEqual({ ok: true, emails: ['Pepper@Stark.com', 'happy@stark.com'] });
  });

  it.each(['pepper', 'pepper@stark', 'pepper stark@stark.com', '@stark.com'])(
    'flags %s as malformed under its own row',
    (malformed) => {
      expect(checkInviteEmails(['happy@stark.com', malformed])).toEqual({
        ok: false,
        errors: [undefined, INVITE_EMAIL_MESSAGES.malformed],
      });
    },
  );

  it('accepts a personal Gmail address, since any Google account can sign in', () => {
    expect(checkInviteEmails(['tony@gmail.com'])).toEqual({
      ok: true,
      emails: ['tony@gmail.com'],
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
