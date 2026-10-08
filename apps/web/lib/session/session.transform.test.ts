import { describe, expect, it } from 'vitest';
import {
  toCurrentAccount,
  toCurrentMembership,
  toNeedsRefresh,
} from './session.transform';

describe('toCurrentAccount', () => {
  it('maps a signed-in answer to the session, with its Profile', () => {
    const profile = { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' };

    expect(
      toCurrentAccount({
        account: { email: 'ann@acme.test', name: 'Ann Lee', profile },
        needsRefresh: false,
      }),
    ).toEqual({ email: 'ann@acme.test', name: 'Ann Lee', profile });
  });

  it('maps an Account that has not introduced itself to no Profile', () => {
    expect(
      toCurrentAccount({
        account: { email: 'ann@acme.test', name: 'Ann Lee', profile: null },
        needsRefresh: false,
      }),
    ).toEqual({ email: 'ann@acme.test', name: 'Ann Lee', profile: null });
  });

  it('maps a signed-out answer to null', () => {
    expect(toCurrentAccount({ account: null, needsRefresh: false })).toBeNull();
  });
});

describe('toNeedsRefresh', () => {
  it('passes the flag on for a signed-in answer', () => {
    expect(
      toNeedsRefresh({
        account: { email: 'ann@acme.test', name: 'Ann Lee', profile: null },
        needsRefresh: true,
      }),
    ).toBe(true);
  });

  it('never asks to refresh when nobody is signed in', () => {
    expect(toNeedsRefresh({ account: null, needsRefresh: true })).toBe(false);
  });
});

describe('toCurrentMembership', () => {
  it("maps the person's Workspace and Role", () => {
    const membership = {
      workspace: { id: 'w-1', name: 'Acme Corp' },
      role: 'OWNER' as const,
    };

    expect(
      toCurrentMembership({
        items: [membership],
        total: 1,
        page: 1,
        pageSize: 1,
      }),
    ).toEqual(membership);
  });

  it('maps belonging to no Workspace to null', () => {
    expect(
      toCurrentMembership({ items: [], total: 0, page: 1, pageSize: 1 }),
    ).toBeNull();
  });
});
