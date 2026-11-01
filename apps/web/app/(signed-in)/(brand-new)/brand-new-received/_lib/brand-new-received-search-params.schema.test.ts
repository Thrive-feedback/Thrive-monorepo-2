import { describe, expect, it } from 'vitest';
import { BrandNewReceivedSearchParams } from './brand-new-received-search-params.schema';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';

describe('BrandNewReceivedSearchParams', () => {
  it('opens on the grid', () => {
    expect(BrandNewReceivedSearchParams.parse({}).view).toBe('grid');
  });

  it('keeps view=list', () => {
    expect(BrandNewReceivedSearchParams.parse({ view: 'list' }).view).toBe(
      'list',
    );
  });

  it('falls back to the grid for a view it does not offer', () => {
    expect(BrandNewReceivedSearchParams.parse({ view: 'table' }).view).toBe(
      'grid',
    );
  });

  it('keeps the piece named in the address', () => {
    expect(
      BrandNewReceivedSearchParams.parse({ feedback: FEEDBACK_ID }),
    ).toEqual({ view: 'grid', feedback: FEEDBACK_ID });
  });

  it('ignores a piece that is not an id', () => {
    expect(
      BrandNewReceivedSearchParams.parse({ feedback: 'nope' }).feedback,
    ).toBeUndefined();
  });
});
