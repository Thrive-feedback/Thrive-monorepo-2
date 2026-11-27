import { describe, expect, it } from 'bun:test';
import { OneOnOneScheduleInvalidError } from '../one-on-one.errors';
import { OneOnOneSchedule } from './one-on-one-schedule.vo';

/** Thursday 26 November 2026, 10:00 in the calendar clock (UTC+7). */
const THURSDAY_TEN = new Date('2026-11-26T03:00:00.000Z');

function choice(
  overrides: Partial<Parameters<typeof OneOnOneSchedule.plan>[0]>,
) {
  return {
    cadence: 'WEEKLY',
    weekday: 4,
    templateKey: 'weekly-check-in',
    ...overrides,
  };
}

describe('a 1:1 schedule', () => {
  it('meets today when today is its day, as a meeting is the whole of its day', () => {
    const schedule = OneOnOneSchedule.plan(choice({}), THURSDAY_TEN);

    expect(schedule.snapshot().startsOn).toBe('2026-11-26');
    // The day starts at midnight on the calendar clock: 17:00 UTC the day before.
    expect(schedule.upcomingAt(THURSDAY_TEN)?.toISOString()).toBe(
      '2026-11-25T17:00:00.000Z',
    );
  });

  it('first meets on the next of its weekday when today is another day', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ weekday: 3 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-12-02');
    expect(schedule.nextAtOrAfter(THURSDAY_TEN)?.toISOString()).toBe(
      '2026-12-01T17:00:00.000Z',
    );
  });

  it('skips the week between meetings every two weeks', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'EVERY_TWO_WEEKS', weekday: 1 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-11-30');
    expect(
      schedule
        .nextAtOrAfter(new Date('2026-12-01T00:00:00.000Z'))
        ?.toISOString(),
    ).toBe('2026-12-13T17:00:00.000Z');
  });

  it('meets monthly on the same week of the month as its first meeting', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'MONTHLY', weekday: 5 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-11-27');
    expect(
      schedule
        .nextAtOrAfter(new Date('2026-11-28T00:00:00.000Z'))
        ?.toISOString(),
    ).toBe('2026-12-24T17:00:00.000Z');
  });

  it('never starts a monthly one in the fifth week, which some months lack', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'MONTHLY', weekday: 1 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-12-07');
  });

  it('comes back the same from what it stores, which holds no time of day', () => {
    const planned = OneOnOneSchedule.plan(choice({}), THURSDAY_TEN);

    const restored = OneOnOneSchedule.restore(planned.snapshot());

    expect(restored.snapshot()).toEqual(planned.snapshot());
    expect(Object.keys(planned.snapshot()).sort()).toEqual([
      'cadence',
      'startsOn',
      'templateKey',
      'weekday',
    ]);
  });

  it.each([
    [{ cadence: 'DAILY' }],
    [{ weekday: 0 }],
    [{ weekday: 8 }],
    [{ templateKey: ' ' }],
  ])('refuses %p', (overrides) => {
    expect(() =>
      OneOnOneSchedule.plan(choice(overrides), THURSDAY_TEN),
    ).toThrow(OneOnOneScheduleInvalidError);
  });

  it('meets once, on the day named, and is over once that day has ended', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'ONCE', weekday: 1, startsOn: '2026-12-02' }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().weekday).toBe(3);
    expect(schedule.nextAtOrAfter(THURSDAY_TEN)?.toISOString()).toBe(
      '2026-12-01T17:00:00.000Z',
    );
    // 23:00 that day in Bangkok: still the meeting to show.
    expect(
      schedule.upcomingAt(new Date('2026-12-02T16:00:00.000Z'))?.toISOString(),
    ).toBe('2026-12-01T17:00:00.000Z');
    expect(schedule.isOverAt(new Date('2026-12-02T16:00:00.000Z'))).toBe(false);
    // Midnight, as the next day starts.
    expect(
      schedule.upcomingAt(new Date('2026-12-02T17:00:00.000Z')),
    ).toBeNull();
    expect(schedule.isOverAt(new Date('2026-12-02T17:00:00.000Z'))).toBe(true);
  });

  it('takes a meeting held once today, and refuses one without its day or on a day gone', () => {
    expect(
      OneOnOneSchedule.plan(
        choice({ cadence: 'ONCE', startsOn: '2026-11-26' }),
        THURSDAY_TEN,
      ).snapshot().startsOn,
    ).toBe('2026-11-26');
    expect(() =>
      OneOnOneSchedule.plan(choice({ cadence: 'ONCE' }), THURSDAY_TEN),
    ).toThrow(OneOnOneScheduleInvalidError);
    expect(() =>
      OneOnOneSchedule.plan(
        choice({ cadence: 'ONCE', startsOn: '2026-11-25' }),
        THURSDAY_TEN,
      ),
    ).toThrow(OneOnOneScheduleInvalidError);
  });

  it('is never over when it repeats', () => {
    const schedule = OneOnOneSchedule.plan(choice({}), THURSDAY_TEN);

    expect(schedule.isOverAt(new Date('2027-06-01T00:00:00.000Z'))).toBe(false);
  });
});
