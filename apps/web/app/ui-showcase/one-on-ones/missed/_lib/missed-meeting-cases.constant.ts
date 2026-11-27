import {
  addDays,
  type Cadence,
  type Day,
  type MeetingEvent,
  type Scenario,
} from './missed-meeting.model';

/** Tuesday 1 December 2026: a 1:1 on Tuesdays meets on the 1st, the 8th, the 15th… */
export const FIRST_DAY: Day = '2026-12-01';
/** How far the simulator's day runs: long enough for a monthly 1:1 to miss three times. */
export const LAST_DAY: Day = '2027-03-09';

/** The second meeting day of each cadence: the day a missed first meeting is skipped. */
const SECOND: Readonly<Record<Exclude<Cadence, 'ONCE'>, Day>> = {
  WEEKLY: '2026-12-08',
  EVERY_TWO_WEEKS: '2026-12-15',
  MONTHLY: '2027-01-05',
};

/** The fourth meeting day: three skipped in a row by then. */
const FOURTH: Readonly<Record<Exclude<Cadence, 'ONCE'>, Day>> = {
  WEEKLY: '2026-12-22',
  EVERY_TWO_WEEKS: '2027-01-12',
  MONTHLY: '2027-03-02',
};

export type MissedCase = {
  readonly id: string;
  readonly title: string;
  /** What it shows, in a line. */
  readonly rule: string;
  readonly scenario: Scenario;
  readonly today: Day;
};

const WRITE: MeetingEvent = {
  kind: 'write',
  day: FIRST_DAY,
  text: 'Launch retro',
};

function on(day: Day): Pick<MeetingEvent, 'day'> {
  return { day };
}

/** Every case of a recurring 1:1, the same eleven for each cadence. */
function recurring(cadence: Exclude<Cadence, 'ONCE'>): MissedCase[] {
  const second = SECOND[cadence];
  const scenario = (events: MeetingEvent[]): Scenario => ({
    cadence,
    startsOn: FIRST_DAY,
    events,
  });
  const late = '2026-12-04';
  // Started early for the second meeting: a day after the late one.
  const early = '2026-12-05';
  return [
    {
      id: `${cadence}-on-the-day`,
      title: 'On the day',
      rule: 'The whole of the day is the meeting’s.',
      scenario: scenario([WRITE]),
      today: FIRST_DAY,
    },
    {
      id: `${cadence}-overdue-agenda`,
      title: 'Overdue, with an agenda',
      rule: 'The day passed unstarted: overdue until the next meeting day, and still startable.',
      scenario: scenario([WRITE]),
      today: addDays(FIRST_DAY, 1),
    },
    {
      id: `${cadence}-overdue-empty`,
      title: 'Overdue, nothing written',
      rule: 'The same with no agenda: nothing moves on when it is skipped.',
      scenario: scenario([]),
      today: addDays(FIRST_DAY, 1),
    },
    {
      id: `${cadence}-late-in-progress`,
      title: 'Started late',
      rule: 'A late start is the missed day’s meeting.',
      scenario: scenario([WRITE, { kind: 'start', ...on(late) }]),
      today: late,
    },
    {
      id: `${cadence}-late-finished`,
      title: 'Held late',
      rule: 'The schedule never moves: the next meeting is the next day on it.',
      scenario: scenario([
        WRITE,
        { kind: 'start', ...on(late) },
        { kind: 'finish', ...on(late) },
      ]),
      today: late,
    },
    {
      id: `${cadence}-early-in-progress`,
      title: 'Started early',
      rule: 'Before its day, a start is that day’s meeting, early.',
      scenario: scenario([
        WRITE,
        { kind: 'start', ...on(late) },
        { kind: 'finish', ...on(late) },
        { kind: 'start', ...on(early) },
      ]),
      today: early,
    },
    {
      id: `${cadence}-early-finished`,
      title: 'Held early',
      rule: 'Never two in one round: the next is the day after the one met early.',
      scenario: scenario([
        WRITE,
        { kind: 'start', ...on(late) },
        { kind: 'finish', ...on(late) },
        { kind: 'start', ...on(early) },
        { kind: 'finish', ...on(early) },
      ]),
      today: early,
    },
    {
      id: `${cadence}-skipped`,
      title: 'Skipped',
      rule: 'The next day came: the missed one is skipped, and its agenda moves to today.',
      scenario: scenario([WRITE]),
      today: second,
    },
    {
      id: `${cadence}-skipped-run`,
      title: 'Skipped in a row',
      rule: 'Every skipped day shows, worked out from the schedule; a run shares one line.',
      scenario: scenario([WRITE]),
      today: FOURTH[cadence],
    },
    {
      id: `${cadence}-rescheduled-overdue`,
      title: 'Changed while overdue',
      rule: 'A new schedule skips the overdue day at once; its agenda moves to the new first day.',
      scenario: scenario([
        WRITE,
        { kind: 'reschedule', ...on(addDays(FIRST_DAY, 1)), weekday: 4 },
      ]),
      today: addDays(FIRST_DAY, 1),
    },
    {
      id: `${cadence}-ended-overdue`,
      title: 'Ended while overdue',
      rule: 'Ending it skips the overdue day; the 1:1 moves to History.',
      scenario: scenario([
        WRITE,
        { kind: 'end', ...on(addDays(FIRST_DAY, 1)) },
      ]),
      today: addDays(FIRST_DAY, 1),
    },
  ];
}

/** Every case of a 1:1 held once. */
function once(): MissedCase[] {
  const scenario = (startsOn: Day, events: MeetingEvent[]): Scenario => ({
    cadence: 'ONCE',
    startsOn,
    events,
  });
  return [
    {
      id: 'ONCE-on-the-day',
      title: 'On the day',
      rule: 'Its one meeting day.',
      scenario: scenario(FIRST_DAY, [WRITE]),
      today: FIRST_DAY,
    },
    {
      id: 'ONCE-overdue',
      title: 'Overdue',
      rule: 'Overdue for seven days, and still startable; Cancel meeting stays in its menu.',
      scenario: scenario(FIRST_DAY, [WRITE]),
      today: addDays(FIRST_DAY, 1),
    },
    {
      id: 'ONCE-overdue-last',
      title: 'Overdue, its last day',
      rule: 'The seventh day after: the last on which it can still be started.',
      scenario: scenario(FIRST_DAY, [WRITE]),
      today: addDays(FIRST_DAY, 6),
    },
    {
      id: 'ONCE-met-late',
      title: 'Held late',
      rule: 'Met, a few days after its day: in History.',
      scenario: scenario(FIRST_DAY, [
        WRITE,
        { kind: 'start', day: '2026-12-04' },
        { kind: 'finish', day: '2026-12-04' },
      ]),
      today: '2026-12-04',
    },
    {
      id: 'ONCE-met-early',
      title: 'Held early',
      rule: 'Met before its day: met, in History, though its day is still to come.',
      scenario: scenario('2026-12-08', [
        { ...WRITE, day: '2026-12-02' },
        { kind: 'start', day: '2026-12-04' },
        { kind: 'finish', day: '2026-12-04' },
      ]),
      today: '2026-12-04',
    },
    {
      id: 'ONCE-skipped',
      title: 'Skipped',
      rule: 'Seven days on, never started: over, and said as skipped.',
      scenario: scenario(FIRST_DAY, [WRITE]),
      today: addDays(FIRST_DAY, 7),
    },
    {
      id: 'ONCE-moved-overdue',
      title: 'Moved while overdue',
      rule: 'A new day skips the overdue one; the agenda moves to the new day.',
      scenario: scenario(FIRST_DAY, [
        WRITE,
        { kind: 'reschedule', day: addDays(FIRST_DAY, 1), weekday: 5 },
      ]),
      today: addDays(FIRST_DAY, 1),
    },
  ];
}

/** Every case, by cadence, in the order the table shows them. */
export const MISSED_CASES: readonly {
  readonly cadence: Cadence;
  readonly cases: readonly MissedCase[];
}[] = [
  { cadence: 'WEEKLY', cases: recurring('WEEKLY') },
  { cadence: 'EVERY_TWO_WEEKS', cases: recurring('EVERY_TWO_WEEKS') },
  { cadence: 'MONTHLY', cases: recurring('MONTHLY') },
  { cadence: 'ONCE', cases: once() },
];
