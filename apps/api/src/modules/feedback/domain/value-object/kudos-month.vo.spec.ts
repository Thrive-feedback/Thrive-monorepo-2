import { describe, expect, it } from 'bun:test';
import { KudosMonth } from './kudos-month.vo';

describe('a month of Kudos', () => {
  it('starts and ends at midnight in UTC+7', () => {
    expect(KudosMonth.of('2026-10').range()).toEqual({
      from: new Date('2026-09-30T17:00:00.000Z'),
      until: new Date('2026-10-31T17:00:00.000Z'),
    });
  });

  it('runs from December into the next year', () => {
    expect(KudosMonth.of('2026-12').range().until).toEqual(
      new Date('2026-12-31T17:00:00.000Z'),
    );
  });

  it('starts January on the last day of the year before, in UTC', () => {
    expect(KudosMonth.of('2027-01').range().from).toEqual(
      new Date('2026-12-31T17:00:00.000Z'),
    );
  });
});
