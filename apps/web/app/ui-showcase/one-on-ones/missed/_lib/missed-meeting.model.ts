/**
 * The spec, as built: what a 1:1 shows when a meeting day passes without anyone pressing Start,
 * worked out from its schedule and what the two did, day by day. The showcase's simulator and its
 * table of cases both draw from this; the API follows the same rules.
 *
 * The rules, as agreed:
 * - A meeting whose day passed unstarted is overdue until the next meeting day; either person may
 *   still start it, late, and it is that day's meeting.
 * - When the next day comes and it was never started, it is skipped: its agenda moves to the new
 *   day. Every skipped day shows in Past meetings; skips in a row share one line.
 * - The schedule never moves: after a late meeting the next one is the next day on it.
 * - Starting before a day is that day's meeting, early: never two in one round.
 * - A meeting held once is overdue for 7 days, then skipped, in History.
 * - Changing the schedule while overdue skips the overdue day at once and moves its agenda to the
 *   new schedule's first day. Ending it while overdue skips that day too.
 * - Overdue is said on the page only; nobody is notified.
 */

export type Cadence = 'WEEKLY' | 'EVERY_TWO_WEEKS' | 'MONTHLY' | 'ONCE';

/** A calendar day, `YYYY-MM-DD`. */
export type Day = string;

export type MeetingEvent =
  | { readonly kind: 'write'; readonly day: Day; readonly text: string }
  | { readonly kind: 'template'; readonly day: Day; readonly name: string }
  | { readonly kind: 'start'; readonly day: Day }
  | { readonly kind: 'finish'; readonly day: Day }
  /** A new weekday; the new schedule first meets on the first such day from the change on. */
  | { readonly kind: 'reschedule'; readonly day: Day; readonly weekday: number }
  | { readonly kind: 'end'; readonly day: Day };

export type Scenario = {
  readonly cadence: Cadence;
  /** The first meeting day, which fixes every later one. */
  readonly startsOn: Day;
  /** What the two did, in the order they did it. */
  readonly events: readonly MeetingEvent[];
};

/** A topic on an agenda; `id` tells two with the same words apart. */
export type Topic = {
  readonly id: number;
  readonly text: string;
  readonly source: string;
};

export type PastRow = {
  readonly label: string;
  readonly detail: string;
  readonly skipped: boolean;
};

export type MeetingView = {
  readonly tab: 'Upcoming' | 'History';
  /** Under the name in the 1:1's head: "Weekly on Tuesday", "Once, on Tue 1 Dec". */
  readonly schedule: string;
  /** In History, what became of it, and a line under it; `null` while it is to come. */
  readonly history: { readonly line: string; readonly note: string } | null;
  readonly card: {
    readonly badge: {
      readonly label: string;
      readonly tone: 'brand' | 'warning';
    } | null;
    readonly line: string;
  };
  /** `null` once nothing is to come: in History. */
  readonly step: {
    readonly word: 'Preparing' | 'Overdue' | 'In progress';
    readonly when: string;
    readonly body: string;
    readonly action: 'Start meeting' | 'Finish';
  } | null;
  readonly agenda: readonly Topic[];
  /** Newest first. */
  readonly past: readonly PastRow[];
  /** What either person may do today. */
  readonly may: ReadonlySet<MeetingEvent['kind']>;
};

const MS_IN_A_DAY = 86_400_000;
/** How long a meeting held once stays overdue before it is skipped. */
const ONCE_OVERDUE_DAYS = 7;

export const CADENCE_WORDS: Readonly<Record<Cadence, string>> = {
  WEEKLY: 'Weekly',
  EVERY_TWO_WEEKS: 'Every 2 weeks',
  MONTHLY: 'Monthly',
  ONCE: 'Once',
};

export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

function toNumber(day: Day): number {
  return Date.parse(`${day}T00:00:00.000Z`) / MS_IN_A_DAY;
}

function toDay(n: number): Day {
  return new Date(n * MS_IN_A_DAY).toISOString().slice(0, 10);
}

/** The day after `day`, or `by` days on. */
export function addDays(day: Day, by: number): Day {
  return toDay(toNumber(day) + by);
}

/** 1 for Monday through 7 for Sunday. */
export function weekdayOf(day: Day): number {
  return new Date(toNumber(day) * MS_IN_A_DAY).getUTCDay() || 7;
}

function weekOfMonth(day: Day): number {
  return Math.ceil(Number(day.slice(8, 10)) / 7);
}

const LONG = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** "Tue 1 Dec". */
export function describe(day: Day): string {
  return LONG.format(new Date(toNumber(day) * MS_IN_A_DAY));
}

type Schedule = {
  readonly cadence: Cadence;
  readonly anchor: Day;
};

function meetsOn(schedule: Schedule, day: Day): boolean {
  const { cadence, anchor } = schedule;
  if (day < anchor || weekdayOf(day) !== weekdayOf(anchor)) {
    return false;
  }
  switch (cadence) {
    case 'ONCE':
      return day === anchor;
    case 'WEEKLY':
      return true;
    case 'EVERY_TWO_WEEKS':
      return (toNumber(day) - toNumber(anchor)) % 14 === 0;
    case 'MONTHLY':
      return weekOfMonth(day) === weekOfMonth(anchor);
  }
}

/** The first meeting day after `day`, or `null` for one held once. */
function nextAfter(schedule: Schedule, day: Day): Day | null {
  if (schedule.cadence === 'ONCE') {
    return null;
  }
  for (let next = addDays(day, 1); ; next = addDays(next, 1)) {
    if (meetsOn(schedule, next)) {
      return next;
    }
  }
}

/** The first day on or after `from` that falls on `weekday`, and for a monthly one, not in a fifth week. */
function firstOn(weekday: number, from: Day, cadence: Cadence): Day {
  let day = from;
  while (
    weekdayOf(day) !== weekday ||
    (cadence === 'MONTHLY' && weekOfMonth(day) > 4)
  ) {
    day = addDays(day, 1);
  }
  return day;
}

type Held = { kind: 'held'; for: Day; on: Day; topics: number };
type Skipped = { kind: 'skipped'; for: Day };

type State = {
  schedule: Schedule;
  /** The meeting day the open meeting belongs to: the earliest not yet held or skipped. */
  due: Day;
  agenda: Topic[];
  startedOn: Day | null;
  past: (Held | Skipped)[];
  /** The day the schedule was ended, or a meeting held once met or skipped. */
  over: { on: Day; why: 'ended' | 'met' | 'skipped' } | null;
};

const SKIPPED_MARK = '(skipped)';

/** Moves the agenda on to a new day, saying where each topic came from. */
function carry(agenda: Topic[], from: Day): Topic[] {
  return agenda.map((topic) =>
    topic.source.endsWith(SKIPPED_MARK)
      ? topic
      : { ...topic, source: `From ${describe(from)} ${SKIPPED_MARK}` },
  );
}

/** "Weekly on Tuesday", "Every 2 weeks on Tuesday", "Monthly on the first Tuesday", "Once, on Tue 1 Dec". */
function scheduleLine(schedule: Schedule): string {
  const day = WEEKDAY_NAMES[weekdayOf(schedule.anchor) - 1] ?? '';
  switch (schedule.cadence) {
    case 'ONCE':
      return `Once, on ${describe(schedule.anchor)}`;
    case 'MONTHLY': {
      const ordinal =
        ['first', 'second', 'third', 'fourth'][
          weekOfMonth(schedule.anchor) - 1
        ] ?? 'first';
      return `Monthly on the ${ordinal} ${day}`;
    }
    default:
      return `${CADENCE_WORDS[schedule.cadence]} on ${day}`;
  }
}

/** What the days themselves do, at the start of `day`: a skip when the next day comes. */
function dawn(state: State, day: Day): void {
  if (state.over || state.startedOn) {
    return;
  }
  const { schedule, due } = state;
  if (schedule.cadence === 'ONCE') {
    if (day >= addDays(due, ONCE_OVERDUE_DAYS)) {
      state.past.push({ kind: 'skipped', for: due });
      state.over = { on: day, why: 'skipped' };
    }
    return;
  }
  if (day > due && meetsOn(schedule, day)) {
    state.past.push({ kind: 'skipped', for: due });
    state.agenda = carry(state.agenda, due);
    state.due = day;
  }
}

function apply(state: State, event: MeetingEvent): void {
  if (state.over) {
    return;
  }
  switch (event.kind) {
    case 'write':
      state.agenda.push({
        id: state.agenda.length + state.past.length * 100,
        text: event.text,
        source: 'Added by You',
      });
      return;
    case 'template':
      state.agenda.push(
        {
          id: state.agenda.length + state.past.length * 100,
          text: 'What slowed us?',
          source: `From ${event.name}`,
        },
        {
          id: state.agenda.length + state.past.length * 100 + 1,
          text: 'What helped?',
          source: `From ${event.name}`,
        },
      );
      return;
    case 'start':
      state.startedOn ??= event.day;
      return;
    case 'finish': {
      if (!state.startedOn) {
        return;
      }
      state.past.push({
        kind: 'held',
        for: state.due,
        on: state.startedOn,
        topics: state.agenda.length,
      });
      state.agenda = [];
      state.startedOn = null;
      const next = nextAfter(state.schedule, state.due);
      if (next === null) {
        state.over = { on: event.day, why: 'met' };
      } else {
        state.due = next;
      }
      return;
    }
    case 'reschedule': {
      if (state.startedOn) {
        return;
      }
      const overdue = state.due < event.day;
      if (overdue) {
        state.past.push({ kind: 'skipped', for: state.due });
        state.agenda = carry(state.agenda, state.due);
      }
      const anchor = firstOn(event.weekday, event.day, state.schedule.cadence);
      state.schedule = { cadence: state.schedule.cadence, anchor };
      state.due = anchor;
      return;
    }
    case 'end':
      if (state.startedOn) {
        return;
      }
      if (state.due < event.day) {
        state.past.push({ kind: 'skipped', for: state.due });
      }
      state.over = { on: event.day, why: 'ended' };
      return;
  }
}

/** Past meetings, newest first, a run of skipped days as one line. */
function pastRows(past: readonly (Held | Skipped)[]): PastRow[] {
  const rows: PastRow[] = [];
  let run: Skipped[] = [];
  const flush = () => {
    if (run.length === 0) {
      return;
    }
    const first = run[0]?.for ?? '';
    const last = run[run.length - 1]?.for ?? '';
    rows.push(
      run.length === 1
        ? { label: describe(first), detail: 'Skipped', skipped: true }
        : {
            label: `${describe(first)} – ${describe(last)}`,
            detail: `Skipped ${run.length} meetings`,
            skipped: true,
          },
    );
    run = [];
  };
  for (const row of past) {
    if (row.kind === 'skipped') {
      run.push(row);
      continue;
    }
    flush();
    const detail =
      row.on === row.for
        ? 'Held'
        : row.on < row.for
          ? `Held early, ${describe(row.on)}`
          : `Held late, ${describe(row.on)}`;
    rows.push({
      label: describe(row.for),
      detail: `${detail} · ${row.topics} ${row.topics === 1 ? 'topic' : 'topics'}`,
      skipped: false,
    });
  }
  flush();
  return rows.reverse();
}

/** The day the last meeting held was held on. */
function lastHeldOn(past: readonly (Held | Skipped)[]): Day | null {
  for (let at = past.length - 1; at >= 0; at -= 1) {
    const row = past[at];
    if (row?.kind === 'held') {
      return row.on;
    }
  }
  return null;
}

const NOTHING: ReadonlySet<MeetingEvent['kind']> = new Set();

/**
 * What a 1:1 on `scenario` shows on `today`: its card in the list, the step at the top of its next
 * meeting, the agenda and Past meetings, and what either person may do. Only what was done by
 * `today` counts.
 */
export function simulate(scenario: Scenario, today: Day): MeetingView {
  const state: State = {
    schedule: { cadence: scenario.cadence, anchor: scenario.startsOn },
    due: scenario.startsOn,
    agenda: [],
    startedOn: null,
    past: [],
    over: null,
  };
  const events = scenario.events.filter((event) => event.day <= today);
  const first = [
    scenario.startsOn,
    ...events.map((event) => event.day),
  ].sort()[0];
  for (let day = first ?? today; day <= today; day = addDays(day, 1)) {
    dawn(state, day);
    for (const event of events) {
      if (event.day === day) {
        apply(state, event);
      }
    }
  }
  const past = pastRows(state.past);
  const word = CADENCE_WORDS[state.schedule.cadence];

  if (state.over) {
    const { on, why } = state.over;
    const schedule = scheduleLine(state.schedule);
    const line =
      why === 'met'
        ? `Met on ${describe(lastHeldOn(state.past) ?? on)}`
        : why === 'skipped'
          ? `Skipped · was set for ${describe(state.due)}`
          : `Schedule ended ${describe(on)} · was ${schedule.charAt(0).toLowerCase()}${schedule.slice(1)}`;
    const note =
      why === 'met'
        ? 'Its summary is in Past meetings.'
        : why === 'skipped'
          ? 'Nobody started it in the week after its day.'
          : state.past.some((row) => row.kind === 'held')
            ? 'You can both still read past meetings.'
            : 'No meetings were finished before it ended.';
    return {
      tab: 'History',
      schedule,
      history: { line, note },
      card: { badge: null, line },
      step: null,
      agenda: [],
      past,
      may: NOTHING,
    };
  }

  const { due, startedOn } = state;
  if (startedOn) {
    const when =
      startedOn === due
        ? 'started today'
        : startedOn < due
          ? `${describe(due)} meeting, started early`
          : `${describe(due)} meeting, started ${describe(startedOn)}`;
    return {
      tab: 'Upcoming',
      schedule: scheduleLine(state.schedule),
      history: null,
      card: { badge: null, line: 'Meeting in progress' },
      step: {
        word: 'In progress',
        when,
        body: 'Tick topics as you cover them and note what you agree. Finishing shares the summary with you both.',
        action: 'Finish',
      },
      agenda: state.agenda,
      past,
      may: new Set(['write', 'template', 'finish']),
    };
  }

  const may: ReadonlySet<MeetingEvent['kind']> = new Set([
    'write',
    'template',
    'start',
    'reschedule',
    'end',
  ]);
  const carriedFrom = state.agenda.find((topic) =>
    topic.source.endsWith(SKIPPED_MARK),
  );
  if (due < today) {
    const isOnce = state.schedule.cadence === 'ONCE';
    const next = isOnce
      ? addDays(due, ONCE_OVERDUE_DAYS)
      : (nextAfter(state.schedule, due) ?? due);
    const lastDay = describe(addDays(next, -1));
    const body = isOnce
      ? `You haven’t met yet. You can still start until ${lastDay}. After that it moves to History as skipped.`
      : state.agenda.length > 0
        ? `You haven’t met yet. You can still start until ${lastDay}. After that it’s skipped and the agenda moves to ${describe(next)}.`
        : `You haven’t met yet. You can still start until ${lastDay}. After that it’s skipped.`;
    return {
      tab: 'Upcoming',
      schedule: scheduleLine(state.schedule),
      history: null,
      card: {
        badge: { label: 'Overdue', tone: 'warning' },
        line: `${word} · was ${describe(due)}`,
      },
      step: {
        word: 'Overdue',
        when: describe(due),
        body,
        action: 'Start meeting',
      },
      agenda: state.agenda,
      past,
      may,
    };
  }

  const isToday = due === today;
  const skippedDay = carriedFrom?.source
    .replace('From ', '')
    .replace(` ${SKIPPED_MARK}`, '');
  return {
    tab: 'Upcoming',
    schedule: scheduleLine(state.schedule),
    history: null,
    card: {
      badge: isToday ? { label: 'Today', tone: 'brand' } : null,
      line: `${word} · Next ${describe(due)}`,
    },
    step: {
      word: 'Preparing',
      when: isToday ? 'Today' : describe(due),
      body: skippedDay
        ? `Carried over from ${skippedDay}, which was skipped. When you meet, either of you can start.`
        : 'Add topics or use a template. When you meet, either of you can start.',
      action: 'Start meeting',
    },
    agenda: state.agenda,
    past,
    may,
  };
}
