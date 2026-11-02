import { describe, expect, it } from 'vitest';
import { PersonalItemsSearchParams } from './personal-items-search-params.schema';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';

describe('PersonalItemsSearchParams', () => {
  it('opens on the grid', () => {
    expect(PersonalItemsSearchParams.parse({}).view).toBe('grid');
  });

  it('keeps view=list', () => {
    expect(PersonalItemsSearchParams.parse({ view: 'list' }).view).toBe('list');
  });

  it('falls back to the grid for a view it does not offer', () => {
    expect(PersonalItemsSearchParams.parse({ view: 'table' }).view).toBe(
      'grid',
    );
  });

  it('keeps the piece named in the address', () => {
    expect(PersonalItemsSearchParams.parse({ feedback: FEEDBACK_ID })).toEqual({
      view: 'grid',
      feedback: FEEDBACK_ID,
    });
  });

  it('ignores a piece that is not an id', () => {
    expect(
      PersonalItemsSearchParams.parse({ feedback: 'nope' }).feedback,
    ).toBeUndefined();
  });
});
