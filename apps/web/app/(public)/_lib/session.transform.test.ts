import { describe, expect, it } from 'vitest';
import { toSession } from './session.transform';

describe('toSession', () => {
  it('maps a signed-in answer to the session', () => {
    expect(
      toSession({ account: { email: 'ann@acme.test', name: 'Ann Lee' } }),
    ).toEqual({ email: 'ann@acme.test', name: 'Ann Lee' });
  });

  it('maps a signed-out answer to null', () => {
    expect(toSession({ account: null })).toBeNull();
  });
});
