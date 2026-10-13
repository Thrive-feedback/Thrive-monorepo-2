import { describe, expect, it } from 'bun:test';
import { InvitationResentTooSoonError } from '../workspace.errors';
import { ResendCooldown } from './resend-cooldown.vo';

const SENT_AT = new Date('2026-10-10T03:00:00Z');

function minutesAfterSending(minutes: number): Date {
  return new Date(SENT_AT.getTime() + minutes * 60 * 1000);
}

describe('the cooldown before an Invitation can be resent', () => {
  it('refuses a resend moments after the last send, saying how long is left', () => {
    expect(() =>
      ResendCooldown.since(SENT_AT).ensureOverAt(minutesAfterSending(1)),
    ).toThrow(new InvitationResentTooSoonError(240));
  });

  it('allows a resend once five minutes have passed', () => {
    expect(() =>
      ResendCooldown.since(SENT_AT).ensureOverAt(minutesAfterSending(5)),
    ).not.toThrow();
  });
});
