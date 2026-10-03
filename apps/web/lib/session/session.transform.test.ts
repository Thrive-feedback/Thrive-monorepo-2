import { describe, expect, it } from 'vitest';
import { toCurrentAccount, toNeedsRefresh } from './session.transform';

describe('toCurrentAccount', () => {
  it('maps a signed-in answer to the session', () => {
    expect(
      toCurrentAccount({
        account: { email: 'ann@acme.test', name: 'Ann Lee' },
        needsRefresh: false,
      }),
    ).toEqual({ email: 'ann@acme.test', name: 'Ann Lee' });
  });

  it('maps a signed-out answer to null', () => {
    expect(toCurrentAccount({ account: null, needsRefresh: false })).toBeNull();
  });
});

describe('toNeedsRefresh', () => {
  it('passes the flag on for a signed-in answer', () => {
    expect(
      toNeedsRefresh({
        account: { email: 'ann@acme.test', name: 'Ann Lee' },
        needsRefresh: true,
      }),
    ).toBe(true);
  });

  it('never asks to refresh when nobody is signed in', () => {
    expect(toNeedsRefresh({ account: null, needsRefresh: true })).toBe(false);
  });
});
