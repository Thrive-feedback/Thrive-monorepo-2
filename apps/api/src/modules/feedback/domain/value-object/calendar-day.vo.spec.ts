import { describe, expect, it } from 'bun:test';
import { CalendarDay, type DayCount, RecentDays } from './calendar-day.vo';

const at = (iso: string) => new Date(iso);

describe('a calendar day', () => {
  it('starts and ends at midnight in UTC+7', () => {
    expect(CalendarDay.of('2026-11-22').range()).toEqual({
      from: at('2026-11-21T17:00:00.000Z'),
      until: at('2026-11-22T17:00:00.000Z'),
    });
  });

  it('puts 23:30 UTC on the next morning', () => {
    expect(CalendarDay.containing(at('2026-11-21T23:30:00Z')).toString()).toBe(
      '2026-11-22',
    );
  });

  it('turns at 17:00 UTC, not a millisecond before', () => {
    expect(
      CalendarDay.containing(at('2026-11-21T16:59:59.999Z')).toString(),
    ).toBe('2026-11-21');
    expect(
      CalendarDay.containing(at('2026-11-21T17:00:00.000Z')).toString(),
    ).toBe('2026-11-22');
  });

  it('runs from the last day of a year into the next', () => {
    expect(
      CalendarDay.containing(at('2026-12-31T17:00:00.000Z')).toString(),
    ).toBe('2027-01-01');
    expect(CalendarDay.of('2027-01-01').minusDays(1).toString()).toBe(
      '2026-12-31',
    );
  });
});

/** The counts with each day written as text, to compare against. */
function asText(counts: readonly DayCount[]) {
  return counts.map(({ day, ...rest }) => ({ day: day.toString(), ...rest }));
}

describe('the last seven days', () => {
  const lastWeek = RecentDays.endingOn(CalendarDay.of('2026-11-22'), 7);
  const none = { offeredFeedback: 0, requestedFeedback: 0, kudos: 0 };

  it('covers seven whole days up to the end of today', () => {
    expect(lastWeek.range()).toEqual({
      from: at('2026-11-15T17:00:00.000Z'),
      until: at('2026-11-22T17:00:00.000Z'),
    });
  });

  it('counts every day, oldest first, the empty ones too', () => {
    expect(asText(lastWeek.count([], []))).toEqual([
      { day: '2026-11-16', ...none },
      { day: '2026-11-17', ...none },
      { day: '2026-11-18', ...none },
      { day: '2026-11-19', ...none },
      { day: '2026-11-20', ...none },
      { day: '2026-11-21', ...none },
      { day: '2026-11-22', ...none },
    ]);
  });

  it('counts Offered and Requested Feedback and Kudos apart', () => {
    const counts = asText(
      lastWeek.count(
        [
          { origin: 'OFFERED', createdAt: at('2026-11-22T03:00:00Z') },
          { origin: 'OFFERED', createdAt: at('2026-11-21T23:30:00Z') },
          { origin: 'REQUESTED', createdAt: at('2026-11-20T09:00:00Z') },
        ],
        [at('2026-11-22T10:00:00Z'), at('2026-11-16T00:00:00Z')],
      ),
    );
    expect(counts.at(-1)).toEqual({
      day: '2026-11-22',
      offeredFeedback: 2,
      requestedFeedback: 0,
      kudos: 1,
    });
    expect(counts.find(({ day }) => day === '2026-11-20')).toEqual({
      day: '2026-11-20',
      ...none,
      requestedFeedback: 1,
    });
    expect(counts[0]).toEqual({ day: '2026-11-16', ...none, kudos: 1 });
  });

  it('leaves out what falls outside the days', () => {
    const counts = lastWeek.count(
      [
        { origin: 'OFFERED', createdAt: at('2026-11-15T16:59:59.999Z') },
        { origin: 'OFFERED', createdAt: at('2026-11-22T17:00:00.000Z') },
      ],
      [],
    );
    expect(counts.every((count) => count.offeredFeedback === 0)).toBe(true);
  });
});

describe('naming a day', () => {
  it('refuses what is not a day', () => {
    expect(() => CalendarDay.of('Wednesday')).toThrow(RangeError);
    expect(() => CalendarDay.of('2026-11-31T00:00')).toThrow(RangeError);
    expect(() => CalendarDay.of('2026-02-30')).toThrow(RangeError);
    expect(() => CalendarDay.of('2026-11-31')).toThrow(RangeError);
  });

  it('adds days up', () => {
    expect(
      RecentDays.total([
        { offeredFeedback: 1, requestedFeedback: 0, kudos: 2 },
        { offeredFeedback: 2, requestedFeedback: 1, kudos: 0 },
      ]),
    ).toEqual({ offeredFeedback: 3, requestedFeedback: 1, kudos: 2 });
  });
});
