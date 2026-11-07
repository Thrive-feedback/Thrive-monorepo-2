import { describe, expect, it } from 'vitest';
import { PersonalItemsSearchParams } from './personal-items-search-params.schema';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';

describe('PersonalItemsSearchParams', () => {
  it('opens on the list', () => {
    expect(PersonalItemsSearchParams.parse({}).view).toBe('list');
  });

  it('keeps view=grid', () => {
    expect(PersonalItemsSearchParams.parse({ view: 'grid' }).view).toBe('grid');
  });

  it('falls back to the list for a view it does not offer', () => {
    expect(PersonalItemsSearchParams.parse({ view: 'table' }).view).toBe(
      'list',
    );
  });

  it('keeps the piece named in the address', () => {
    expect(PersonalItemsSearchParams.parse({ feedback: FEEDBACK_ID })).toEqual({
      view: 'list',
      feedback: FEEDBACK_ID,
    });
  });

  it('ignores a piece that is not an id', () => {
    expect(
      PersonalItemsSearchParams.parse({ feedback: 'nope' }).feedback,
    ).toBeUndefined();
  });
});
