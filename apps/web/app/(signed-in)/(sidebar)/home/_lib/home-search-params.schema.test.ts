import { describe, expect, it } from 'vitest';
import { HomeSearchParams } from './home-search-params.schema';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';

describe('HomeSearchParams', () => {
  it('opens on All Feedback', () => {
    expect(HomeSearchParams.parse({}).show).toBe('all');
  });

  it.each(['everyone', 'shared'] as const)('keeps show=%s', (show) => {
    expect(HomeSearchParams.parse({ show }).show).toBe(show);
  });

  it('falls back to All Feedback for a filter it does not offer', () => {
    expect(HomeSearchParams.parse({ show: 'mine' }).show).toBe('all');
  });

  it('keeps the piece named in the address', () => {
    expect(HomeSearchParams.parse({ feedback: FEEDBACK_ID })).toEqual({
      show: 'all',
      feedback: FEEDBACK_ID,
    });
  });

  it.each(['signedIn', 'opened', 'left', 'switched'] as const)(
    'keeps %s=1, so the page can say it once',
    (flag) => {
      expect(HomeSearchParams.parse({ [flag]: '1' })[flag]).toBe('1');
    },
  );

  it.each(['signedIn', 'opened', 'left', 'switched'] as const)(
    'ignores %s set to anything but 1',
    (flag) => {
      expect(HomeSearchParams.parse({ [flag]: 'yes' })[flag]).toBeUndefined();
    },
  );

  it('ignores a piece that is not an id', () => {
    expect(
      HomeSearchParams.parse({ feedback: 'nope' }).feedback,
    ).toBeUndefined();
  });
});
