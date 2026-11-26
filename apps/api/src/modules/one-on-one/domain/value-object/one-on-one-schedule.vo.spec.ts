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
    startMinute: 10 * 60 + 30,
    lengthMinutes: 30,
    templateKey: 'weekly-check-in',
    ...overrides,
  };
}

describe('a 1:1 schedule', () => {
  it('meets later the same day when its time has not passed yet', () => {
    const schedule = OneOnOneSchedule.plan(choice({}), THURSDAY_TEN);

    expect(schedule.snapshot().startsOn).toBe('2026-11-26');
    expect(schedule.nextAtOrAfter(THURSDAY_TEN)?.toISOString()).toBe(
      '2026-11-26T03:30:00.000Z',
    );
  });

  it('first meets next week when its time today has passed', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ startMinute: 9 * 60 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-12-03');
    expect(schedule.nextAtOrAfter(THURSDAY_TEN)?.toISOString()).toBe(
      '2026-12-03T02:00:00.000Z',
    );
  });

  it('skips the week between meetings every two weeks', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'EVERY_TWO_WEEKS', weekday: 1, startMinute: 9 * 60 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-11-30');
    expect(
      schedule
        .nextAtOrAfter(new Date('2026-12-01T00:00:00.000Z'))
        ?.toISOString(),
    ).toBe('2026-12-14T02:00:00.000Z');
  });

  it('meets monthly on the same week of the month as its first meeting', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'MONTHLY', weekday: 5, startMinute: 16 * 60 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-11-27');
    expect(
      schedule
        .nextAtOrAfter(new Date('2026-11-28T00:00:00.000Z'))
        ?.toISOString(),
    ).toBe('2026-12-25T09:00:00.000Z');
  });

  it('never starts a monthly one in the fifth week, which some months lack', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'MONTHLY', weekday: 1, startMinute: 9 * 60 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-12-07');
  });

  it('comes back the same from what it stores', () => {
    const planned = OneOnOneSchedule.plan(choice({}), THURSDAY_TEN);

    const restored = OneOnOneSchedule.restore(planned.snapshot());

    expect(restored.snapshot()).toEqual(planned.snapshot());
  });

  it.each([
    [{ cadence: 'DAILY' }],
    [{ weekday: 0 }],
    [{ weekday: 8 }],
    [{ startMinute: 24 * 60 }],
    [{ lengthMinutes: 25 }],
    [{ templateKey: ' ' }],
  ])('refuses %p', (overrides) => {
    expect(() =>
      OneOnOneSchedule.plan(choice(overrides), THURSDAY_TEN),
    ).toThrow(OneOnOneScheduleInvalidError);
  });

  it('meets once, on the day named, and is over once that meeting has ended', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'ONCE', weekday: 1, startsOn: '2026-12-02' }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().weekday).toBe(3);
    expect(schedule.nextAtOrAfter(THURSDAY_TEN)?.toISOString()).toBe(
      '2026-12-02T03:30:00.000Z',
    );
    // In progress, 10:30 to 11:00 Bangkok time: still the meeting to show.
    expect(
      schedule.upcomingAt(new Date('2026-12-02T03:45:00.000Z'))?.toISOString(),
    ).toBe('2026-12-02T03:30:00.000Z');
    expect(schedule.isOverAt(new Date('2026-12-02T03:45:00.000Z'))).toBe(false);
    expect(
      schedule.upcomingAt(new Date('2026-12-02T04:00:00.000Z')),
    ).toBeNull();
    expect(schedule.isOverAt(new Date('2026-12-02T04:00:00.000Z'))).toBe(true);
  });

  it('refuses a meeting held once without its day, or on a day that has passed', () => {
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
