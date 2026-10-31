import { describe, expect, it } from 'vitest';
import { BrandNewHomeSearchParams } from './brand-new-home-search-params.schema';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';

describe('BrandNewHomeSearchParams', () => {
  it('opens on All Feedback', () => {
    expect(BrandNewHomeSearchParams.parse({}).show).toBe('all');
  });

  it.each(['everyone', 'shared'] as const)('keeps show=%s', (show) => {
    expect(BrandNewHomeSearchParams.parse({ show }).show).toBe(show);
  });

  it('falls back to All Feedback for a filter it does not offer', () => {
    expect(BrandNewHomeSearchParams.parse({ show: 'mine' }).show).toBe('all');
  });

  it('keeps the piece named in the address', () => {
    expect(BrandNewHomeSearchParams.parse({ feedback: FEEDBACK_ID })).toEqual({
      show: 'all',
      feedback: FEEDBACK_ID,
    });
  });

  it('ignores a piece that is not an id', () => {
    expect(
      BrandNewHomeSearchParams.parse({ feedback: 'nope' }).feedback,
    ).toBeUndefined();
  });
});
