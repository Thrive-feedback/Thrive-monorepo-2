import { describe, expect, it } from 'bun:test';
import { InvitationStatus } from './invitation-status.vo';

const NOW = new Date('2026-10-10T03:00:00Z');

describe('the status of an open Invitation', () => {
  it('is Pending before its expiry', () => {
    expect(
      InvitationStatus.at(new Date('2026-10-17T03:00:00Z'), NOW).toString(),
    ).toBe('PENDING');
  });

  it('is Expired from the instant it expires', () => {
    expect(InvitationStatus.at(NOW, NOW).toString()).toBe('EXPIRED');
  });
});
