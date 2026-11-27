import { describe, expect, it } from 'bun:test';
import { OneOnOneScheduleInvalidError } from '../one-on-one.errors';
import { OneOnOneSchedule } from './one-on-one-schedule.vo';

/** Thursday 26 November 2026, 10:00 in the calendar clock (UTC+7). */
const THURSDAY_TEN = new Date('2026-11-26T03:00:00.000Z');

/** Noon in Bangkok on a `YYYY-MM-DD` day: well inside it, either side of the offset. */
function noonOn(day: string): Date {
  return new Date(`${day}T05:00:00.000Z`);
}

/** The start of a `YYYY-MM-DD` day in Bangkok, as the schedule says a meeting's day. */
function startOf(day: string): string {
  return new Date(
    Date.parse(`${day}T00:00:00.000Z`) - 7 * 3_600_000,
  ).toISOString();
}

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

/** Weekly on Thursdays from Thu 26 Nov: the 26th, 3 Dec, 10 Dec… */
const weekly = () => OneOnOneSchedule.plan(choice({}), THURSDAY_TEN);

describe('a 1:1 schedule', () => {
  it('first meets today when today is its day, as a meeting is the whole of its day', () => {
    expect(weekly().snapshot().startsOn).toBe('2026-11-26');
    expect(weekly().dueAt(THURSDAY_TEN, null)?.toISOString()).toBe(
      startOf('2026-11-26'),
    );
  });

  it('first meets on the next of its weekday when today is another day', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ weekday: 3 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-12-02');
    expect(schedule.dueAt(THURSDAY_TEN, null)?.toISOString()).toBe(
      startOf('2026-12-02'),
    );
  });

  it('keeps a meeting not started due after its day, until the next meeting day', () => {
    expect(weekly().dueAt(noonOn('2026-12-02'), null)?.toISOString()).toBe(
      startOf('2026-11-26'),
    );
    expect(
      weekly()
        .skippedAt(new Date(startOf('2026-11-26')))
        .toISOString(),
    ).toBe(startOf('2026-12-03'));
    // The next meeting day comes: it is the one due, and the 26th is skipped.
    expect(weekly().dueAt(noonOn('2026-12-03'), null)?.toISOString()).toBe(
      startOf('2026-12-03'),
    );
    expect(weekly().skippedDays(noonOn('2026-12-03'), [])).toEqual([
      '2026-11-26',
    ]);
  });

  it('counts the next meeting from the day the last one held was for, late or early', () => {
    // Held for the 26th on the 28th, late: the 3rd is next.
    expect(
      weekly()
        .dueAt(noonOn('2026-11-28'), new Date(startOf('2026-11-26')))
        ?.toISOString(),
    ).toBe(startOf('2026-12-03'));
    // Held for the 3rd on the 29th, early: the 10th is next, never a second for the 3rd.
    expect(
      weekly()
        .dueAt(noonOn('2026-11-29'), new Date(startOf('2026-12-03')))
        ?.toISOString(),
    ).toBe(startOf('2026-12-10'));
  });

  it('skips the days no meeting was held for, from its first until the one due', () => {
    const heldFor = [new Date(startOf('2026-12-03'))];

    expect(weekly().skippedDays(noonOn('2026-12-17'), heldFor)).toEqual([
      '2026-11-26',
      '2026-12-10',
    ]);
  });

  it('closing, skips the day due too when it is overdue and nobody started it', () => {
    expect(
      weekly().skippedDaysClosingAt(noonOn('2026-11-27'), [], false),
    ).toEqual(['2026-11-26']);
    expect(
      weekly().skippedDaysClosingAt(noonOn('2026-11-27'), [], true),
    ).toEqual([]);
  });

  it('skips the week between meetings every two weeks', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'EVERY_TWO_WEEKS', weekday: 1 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-11-30');
    expect(
      schedule.skippedAt(new Date(startOf('2026-11-30'))).toISOString(),
    ).toBe(startOf('2026-12-14'));
  });

  it('meets monthly on the same week of the month as its first meeting', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'MONTHLY', weekday: 5 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-11-27');
    expect(
      schedule.skippedAt(new Date(startOf('2026-11-27'))).toISOString(),
    ).toBe(startOf('2026-12-25'));
  });

  it('never starts a monthly one in the fifth week, which some months lack', () => {
    const schedule = OneOnOneSchedule.plan(
      choice({ cadence: 'MONTHLY', weekday: 1 }),
      THURSDAY_TEN,
    );

    expect(schedule.snapshot().startsOn).toBe('2026-12-07');
  });

  it('comes back the same from what it stores, which holds no time of day', () => {
    const planned = weekly();

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

  it('is never over when it repeats', () => {
    expect(weekly().isOverAt(new Date('2027-06-01T00:00:00.000Z'))).toBe(false);
  });
});

describe('a 1:1 schedule, accepted, changed and carried', () => {
  it('counts its meetings from the day it is accepted, keeping its weekday', () => {
    const accepted = weekly().startingFrom(noonOn('2026-12-16'));

    expect(accepted.snapshot().startsOn).toBe('2026-12-17');
    expect(accepted.skippedDays(noonOn('2026-12-17'), [])).toEqual([]);
  });

  it('keeps every second week from its first meeting when accepted later', () => {
    const fortnightly = OneOnOneSchedule.plan(
      choice({ cadence: 'EVERY_TWO_WEEKS' }),
      THURSDAY_TEN,
    );

    // 26 Nov, 10 Dec, 24 Dec: accepted on 1 Dec, it first meets on the 10th, not the 3rd.
    expect(
      fortnightly.startingFrom(noonOn('2026-12-01')).snapshot().startsOn,
    ).toBe('2026-12-10');
  });

  it('counts no meeting held under a schedule since changed', () => {
    // Moved to Tuesdays from Tue 8 Dec, after the Thursday 10 Dec meeting was held early.
    const tuesdays = OneOnOneSchedule.plan(
      choice({ weekday: 2 }),
      noonOn('2026-12-07'),
    );
    const heldFor = [new Date(startOf('2026-12-10'))];

    expect(
      tuesdays
        .dueAt(noonOn('2026-12-07'), tuesdays.lastHeldOn(heldFor))
        ?.toISOString(),
    ).toBe(startOf('2026-12-08'));
    expect(tuesdays.skippedDays(noonOn('2026-12-07'), heldFor)).toEqual([]);
  });

  it('says a topic was carried from the day it was written for, once that day is skipped', () => {
    expect(
      weekly().carriedFrom(noonOn('2026-11-27'), noonOn('2026-12-03'), []),
    ).toBe('2026-11-26');
    // Written once the 3rd was due: nothing skipped since.
    expect(
      weekly().carriedFrom(noonOn('2026-12-03'), noonOn('2026-12-04'), []),
    ).toBeNull();
  });

  it('closing, also counts the day due as skipped when it is overdue, as a change does', () => {
    // Written Fri 27 Nov for Thu 26, overdue; the schedule changes on Sat 28.
    expect(
      weekly().carriedFrom(
        noonOn('2026-11-27'),
        noonOn('2026-11-28'),
        [],
        true,
      ),
    ).toBe('2026-11-26');
    expect(
      weekly().carriedFrom(noonOn('2026-11-27'), noonOn('2026-11-28'), []),
    ).toBeNull();
  });

  it('says a topic written before its first day was for that day, once it is skipped', () => {
    // From Thu 26 Nov; written Tue 24 Nov, and the 26th was never started.
    expect(
      weekly().carriedFrom(noonOn('2026-11-24'), noonOn('2026-12-03'), []),
    ).toBe('2026-11-26');
  });

  it('says nothing for a topic written before its first day while that day is still to come', () => {
    const fridays = OneOnOneSchedule.plan(
      choice({ weekday: 5 }),
      noonOn('2026-12-15'),
    );

    expect(
      fridays.carriedFrom(noonOn('2026-12-14'), noonOn('2026-12-16'), []),
    ).toBeNull();
  });
});

describe('a 1:1 held once', () => {
  const once = () =>
    OneOnOneSchedule.plan(
      choice({ cadence: 'ONCE', weekday: 1, startsOn: '2026-12-02' }),
      THURSDAY_TEN,
    );

  it('has its day pass for an invitation the day after it, though it stays overdue once running', () => {
    expect(once().hasDayPassedAt(noonOn('2026-12-02'))).toBe(false);
    expect(once().hasDayPassedAt(noonOn('2026-12-03'))).toBe(true);
    expect(once().isOverAt(noonOn('2026-12-03'))).toBe(false);
  });

  it('meets on the day named, and is overdue for a week after it', () => {
    expect(once().snapshot().weekday).toBe(3);
    expect(once().dueAt(noonOn('2026-12-08'), null)?.toISOString()).toBe(
      startOf('2026-12-02'),
    );
    expect(
      once()
        .skippedAt(new Date(startOf('2026-12-02')))
        .toISOString(),
    ).toBe(startOf('2026-12-09'));
    expect(once().isOverAt(noonOn('2026-12-08'))).toBe(false);
  });

  it('is over and skipped a week on, never started', () => {
    expect(once().dueAt(noonOn('2026-12-09'), null)).toBeNull();
    expect(once().isOverAt(noonOn('2026-12-09'))).toBe(true);
    expect(once().skippedDays(noonOn('2026-12-09'), [])).toEqual([
      '2026-12-02',
    ]);
  });

  it('has nothing due once its meeting was held, early or late', () => {
    const heldFor = [new Date(startOf('2026-12-02'))];

    expect(once().dueAt(THURSDAY_TEN, heldFor[0] ?? null)).toBeNull();
    expect(once().skippedDays(noonOn('2026-12-20'), heldFor)).toEqual([]);
  });

  it('takes its day today, and refuses one without its day or on a day gone', () => {
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
});
