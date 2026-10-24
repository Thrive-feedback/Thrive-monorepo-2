import { describe, expect, it } from 'vitest';
import {
  toCurrentAccount,
  toCurrentMembership,
  toNeedsRefresh,
} from './session.transform';

const ANN_ACCOUNT_ID = '0199a0f0-0000-7000-8000-000000000001';
const PHOTO = 'https://lh3.googleusercontent.com/a/ann=s96-c';

describe('toCurrentAccount', () => {
  it('maps a signed-in answer to the session, with its photo and Profile', () => {
    const profile = { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' };

    expect(
      toCurrentAccount({
        account: {
          accountId: ANN_ACCOUNT_ID,
          email: 'ann@acme.test',
          name: 'Ann Lee',
          photoUrl: PHOTO,
          profile,
        },
        needsRefresh: false,
      }),
    ).toEqual({
      email: 'ann@acme.test',
      name: 'Ann Lee',
      photoUrl: PHOTO,
      profile,
    });
  });

  it('maps an Account that has not introduced itself to no Profile', () => {
    expect(
      toCurrentAccount({
        account: {
          accountId: ANN_ACCOUNT_ID,
          email: 'ann@acme.test',
          name: 'Ann Lee',
          photoUrl: null,
          profile: null,
        },
        needsRefresh: false,
      }),
    ).toEqual({
      email: 'ann@acme.test',
      name: 'Ann Lee',
      photoUrl: null,
      profile: null,
    });
  });

  it('maps a signed-out answer to null', () => {
    expect(toCurrentAccount({ account: null, needsRefresh: false })).toBeNull();
  });
});

describe('toNeedsRefresh', () => {
  it('passes the flag on for a signed-in answer', () => {
    expect(
      toNeedsRefresh({
        account: {
          accountId: ANN_ACCOUNT_ID,
          email: 'ann@acme.test',
          name: 'Ann Lee',
          photoUrl: null,
          profile: null,
        },
        needsRefresh: true,
      }),
    ).toBe(true);
  });

  it('never asks to refresh when nobody is signed in', () => {
    expect(toNeedsRefresh({ account: null, needsRefresh: true })).toBe(false);
  });
});

describe('toCurrentMembership', () => {
  it("maps the session's Workspace and the person's Role there", () => {
    const membership = {
      workspace: { id: 'w-1', name: 'Acme Corp' },
      role: 'ADMIN' as const,
    };

    expect(toCurrentMembership({ membership })).toEqual(membership);
  });

  it('maps a session in no Workspace to null', () => {
    expect(toCurrentMembership({ membership: null })).toBeNull();
  });
});
