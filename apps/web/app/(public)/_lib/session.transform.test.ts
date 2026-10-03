import { describe, expect, it } from 'vitest';
import { toNeedsRefresh, toSession } from './session.transform';

describe('toSession', () => {
  it('maps a signed-in answer to the session', () => {
    expect(
      toSession({
        account: { email: 'ann@acme.test', name: 'Ann Lee' },
        needsRefresh: false,
      }),
    ).toEqual({ email: 'ann@acme.test', name: 'Ann Lee' });
  });

  it('maps a signed-out answer to null', () => {
    expect(toSession({ account: null, needsRefresh: false })).toBeNull();
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
