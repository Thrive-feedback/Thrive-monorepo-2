import { describe, expect, it } from 'bun:test';
import {
  InvitationAlreadyAcceptedError,
  InvitationExpiredError,
  InvitationRevokedError,
} from '../workspace.errors';
import { InvitationStatus } from './invitation-status.vo';

const NOW = new Date('2026-10-10T03:00:00Z');
const NEXT_WEEK = new Date('2026-10-17T03:00:00Z');

describe('the status of an open Invitation', () => {
  it('is Pending before its expiry', () => {
    expect(InvitationStatus.at(NEXT_WEEK, NOW).toString()).toBe('PENDING');
  });

  it('is Expired from the instant it expires', () => {
    expect(InvitationStatus.at(NOW, NOW).toString()).toBe('EXPIRED');
  });
});

describe('accepting an Invitation in each status', () => {
  it('is allowed while it is Pending', () => {
    expect(() =>
      InvitationStatus.at(NEXT_WEEK, NOW).ensureAcceptable(),
    ).not.toThrow();
  });

  it('is refused once it has Expired', () => {
    expect(() => InvitationStatus.at(NOW, NOW).ensureAcceptable()).toThrow(
      InvitationExpiredError,
    );
  });

  it('is refused once it was Revoked', () => {
    expect(() => InvitationStatus.Revoked.ensureAcceptable()).toThrow(
      InvitationRevokedError,
    );
  });

  it('is refused a second time, once it was Accepted', () => {
    expect(() => InvitationStatus.Accepted.ensureAcceptable()).toThrow(
      InvitationAlreadyAcceptedError,
    );
  });
});

describe('revoking an Invitation in each status', () => {
  it('is allowed while it is Pending', () => {
    expect(() =>
      InvitationStatus.at(NEXT_WEEK, NOW).ensureRevocable(),
    ).not.toThrow();
  });

  it('is allowed once it has Expired, to clear it away', () => {
    expect(() => InvitationStatus.at(NOW, NOW).ensureRevocable()).not.toThrow();
  });

  it('is refused once it was Accepted', () => {
    expect(() => InvitationStatus.Accepted.ensureRevocable()).toThrow(
      InvitationAlreadyAcceptedError,
    );
  });

  it('is refused once it was already Revoked', () => {
    expect(() => InvitationStatus.Revoked.ensureRevocable()).toThrow(
      InvitationRevokedError,
    );
  });
});
