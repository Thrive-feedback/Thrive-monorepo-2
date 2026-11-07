import { describe, expect, it } from 'vitest';
import { BrandNewKudosSearchParams } from './brand-new-kudos-search-params.schema';

describe('the Kudos board address', () => {
  it('keeps a month', () => {
    expect(BrandNewKudosSearchParams.parse({ month: '2026-10' })).toEqual({
      month: '2026-10',
    });
  });

  it.each(['2026-13', '2026-00', '2026-1', 'october', ''])(
    'shows every month for %j',
    (month) => {
      expect(BrandNewKudosSearchParams.parse({ month }).month).toBeUndefined();
    },
  );

  it('shows every month when it is given twice', () => {
    expect(
      BrandNewKudosSearchParams.parse({ month: ['2026-10', '2026-11'] }).month,
    ).toBeUndefined();
  });

  it('shows every month when none is asked for', () => {
    expect(BrandNewKudosSearchParams.parse({}).month).toBeUndefined();
  });
});
