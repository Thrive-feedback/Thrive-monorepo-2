import { describe, expect, it } from 'vitest';
import {
  type MeetingEvent,
  type Scenario,
  simulate,
} from './missed-meeting.model';
import { MISSED_CASES } from './missed-meeting-cases.constant';

/** A weekly 1:1 on Tuesdays from Tue 1 Dec 2026: the 1st, the 8th, the 15th… */
function weekly(events: MeetingEvent[] = []): Scenario {
  return { cadence: 'WEEKLY', startsOn: '2026-12-01', events };
}

const WROTE: MeetingEvent = {
  kind: 'write',
  day: '2026-12-01',
  text: 'Launch retro',
};

describe('a missed meeting', () => {
  it('is overdue from the day after, and can still be started', () => {
    const view = simulate(weekly([WROTE]), '2026-12-02');

    expect(view.card.badge).toEqual({ label: 'Overdue', tone: 'warning' });
    expect(view.step).toMatchObject({
      word: 'Overdue',
      when: 'Tue 1 Dec',
      action: 'Start meeting',
    });
    expect(view.step?.body).toContain('until Mon 7 Dec');
    expect(view.may.has('start')).toBe(true);
    expect(view.past).toEqual([]);
  });

  it('stays overdue up to the day before the next meeting day', () => {
    expect(simulate(weekly([WROTE]), '2026-12-07').step?.word).toBe('Overdue');
  });

  it('is skipped when the next day comes, its agenda moving to that day', () => {
    const view = simulate(weekly([WROTE]), '2026-12-08');

    expect(view.step).toMatchObject({ word: 'Preparing', when: 'Today' });
    expect(view.agenda).toMatchObject([
      { text: 'Launch retro', source: 'From Tue 1 Dec (skipped)' },
    ]);
    expect(view.past).toEqual([
      { label: 'Tue 1 Dec', detail: 'Skipped', skipped: true },
    ]);
  });

  it('shows skips in a row as one line, worked out from the schedule', () => {
    const view = simulate(weekly(), '2026-12-22');

    expect(view.past).toEqual([
      {
        label: 'Tue 1 Dec – Tue 15 Dec',
        detail: 'Skipped 3 meetings',
        skipped: true,
      },
    ]);
  });

  it('started late is the missed day’s meeting, and the schedule does not move', () => {
    const started = weekly([WROTE, { kind: 'start', day: '2026-12-04' }]);
    expect(simulate(started, '2026-12-04').step?.when).toBe(
      'Tue 1 Dec meeting, started Fri 4 Dec',
    );

    const held = simulate(
      weekly([
        WROTE,
        { kind: 'start', day: '2026-12-04' },
        { kind: 'finish', day: '2026-12-04' },
      ]),
      '2026-12-04',
    );
    expect(held.step).toMatchObject({ word: 'Preparing', when: 'Tue 8 Dec' });
    expect(held.past[0]).toMatchObject({
      label: 'Tue 1 Dec',
      detail: 'Held late, Fri 4 Dec · 1 topic',
    });
  });

  it('started early is the coming day’s meeting, so there are never two in a round', () => {
    const view = simulate(
      weekly([
        { kind: 'start', day: '2026-12-05' },
        { kind: 'finish', day: '2026-12-05' },
      ]),
      '2026-12-05',
    );

    // Nothing was held for the 1st, which had passed by the 5th: it is the 1st's meeting, late.
    expect(view.past[0]?.detail).toContain('Held late');
    const early = simulate(
      weekly([
        { kind: 'start', day: '2026-12-01' },
        { kind: 'finish', day: '2026-12-01' },
        { kind: 'start', day: '2026-12-05' },
        { kind: 'finish', day: '2026-12-05' },
      ]),
      '2026-12-05',
    );
    expect(early.past[0]).toMatchObject({
      label: 'Tue 8 Dec',
      detail: 'Held early, Sat 5 Dec · 0 topics',
    });
    expect(early.step?.when).toBe('Tue 15 Dec');
  });

  it('skips the overdue day at once when the schedule changes, moving the agenda to the new first day', () => {
    const view = simulate(
      weekly([WROTE, { kind: 'reschedule', day: '2026-12-02', weekday: 4 }]),
      '2026-12-02',
    );

    expect(view.step).toMatchObject({ word: 'Preparing', when: 'Thu 3 Dec' });
    expect(view.agenda[0]?.source).toBe('From Tue 1 Dec (skipped)');
    expect(view.past[0]).toMatchObject({ label: 'Tue 1 Dec', skipped: true });
  });

  it('skips the overdue day when the schedule ends, and moves to History', () => {
    const view = simulate(
      weekly([WROTE, { kind: 'end', day: '2026-12-02' }]),
      '2026-12-02',
    );

    expect(view.tab).toBe('History');
    expect(view.step).toBeNull();
    expect(view.past[0]).toMatchObject({ label: 'Tue 1 Dec', skipped: true });
  });

  it('gives every two weeks fourteen days, and monthly until its next monthly day', () => {
    const fortnightly: Scenario = {
      cadence: 'EVERY_TWO_WEEKS',
      startsOn: '2026-12-01',
      events: [],
    };
    expect(simulate(fortnightly, '2026-12-14').step?.word).toBe('Overdue');
    expect(simulate(fortnightly, '2026-12-15').past[0]?.skipped).toBe(true);

    const monthly: Scenario = {
      cadence: 'MONTHLY',
      startsOn: '2026-12-01',
      events: [],
    };
    expect(simulate(monthly, '2027-01-04').step?.body).toContain(
      'until Mon 4 Jan',
    );
    expect(simulate(monthly, '2027-01-05').past[0]?.skipped).toBe(true);
  });
});

describe('a missed meeting held once', () => {
  const once = (events: MeetingEvent[] = []): Scenario => ({
    cadence: 'ONCE',
    startsOn: '2026-12-01',
    events,
  });

  it('is overdue for seven days, then skipped in History', () => {
    expect(simulate(once(), '2026-12-07').step?.word).toBe('Overdue');
    expect(simulate(once(), '2026-12-07').step?.body).toContain(
      'until Mon 7 Dec',
    );

    const skipped = simulate(once(), '2026-12-08');
    expect(skipped.tab).toBe('History');
    expect(skipped.card.line).toBe('Skipped · was set for Tue 1 Dec');
  });

  it('is met once its meeting is finished, late or early', () => {
    const late = simulate(
      once([
        { kind: 'start', day: '2026-12-04' },
        { kind: 'finish', day: '2026-12-04' },
      ]),
      '2026-12-04',
    );
    expect(late.tab).toBe('History');
    expect(late.card.line).toBe('Met on Fri 4 Dec');
  });
});

describe('every case in the table', () => {
  it('draws something for each, with no two ids alike', () => {
    const ids = MISSED_CASES.flatMap(({ cases }) =>
      cases.map((each) => each.id),
    );

    expect(new Set(ids).size).toBe(ids.length);
    for (const { cases } of MISSED_CASES) {
      for (const each of cases) {
        const view = simulate(each.scenario, each.today);
        expect(view.card.line).not.toBe('');
      }
    }
  });
});
