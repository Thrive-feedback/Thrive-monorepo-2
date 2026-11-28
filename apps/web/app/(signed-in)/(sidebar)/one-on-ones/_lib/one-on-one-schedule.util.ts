import type {
  OneOnOneCadence,
  OneOnOneSchedule,
  OneOnOneScheduleChoice,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';

/**
 * The clock a 1:1's schedule is kept on: the API keeps every schedule in the one calendar clock,
 * UTC+7, which Thailand keeps all year (the API's `CALENDAR_UTC_OFFSET_HOURS`).
 */
const SCHEDULE_TIME_ZONE = 'Asia/Bangkok';

export const CADENCE_WORDS: Readonly<Record<OneOnOneCadence, string>> = {
  WEEKLY: 'Weekly',
  EVERY_TWO_WEEKS: 'Every 2 weeks',
  MONTHLY: 'Monthly',
  ONCE: 'Just once',
};

export const CADENCES: readonly OneOnOneCadence[] = [
  'WEEKLY',
  'EVERY_TWO_WEEKS',
  'MONTHLY',
  'ONCE',
];

/** 1 is Monday and 7 is Sunday, as the API counts them. */
export const WEEKDAYS: readonly {
  value: number;
  name: string;
  short: string;
}[] = [
  { value: 1, name: 'Monday', short: 'Mon' },
  { value: 2, name: 'Tuesday', short: 'Tue' },
  { value: 3, name: 'Wednesday', short: 'Wed' },
  { value: 4, name: 'Thursday', short: 'Thu' },
  { value: 5, name: 'Friday', short: 'Fri' },
  { value: 6, name: 'Saturday', short: 'Sat' },
  { value: 7, name: 'Sunday', short: 'Sun' },
];

const ORDINALS = ['first', 'second', 'third', 'fourth'] as const;

/** What a new 1:1 starts at: weekly, on Thursdays. A 1:1 is kept by the day, with no time of day. */
export const DEFAULT_SCHEDULE: OneOnOneScheduleChoice = {
  cadence: 'WEEKLY',
  weekday: 4,
};

function weekdayName(weekday: number): string {
  return WEEKDAYS.find((day) => day.value === weekday)?.name ?? '';
}

/** Which week of its month a `YYYY-MM-DD` day falls in, as the API counts it. */
function weekOfMonth(day: string): number {
  return Math.ceil(Number(day.slice(8, 10)) / 7);
}

/**
 * The schedule said as a sentence, by the day alone: "Weekly on Thursday", "Every 2 weeks on
 * Monday", "Monthly on the second Friday", "Once, on Wed 2 Dec".
 */
export function describeSchedule(schedule: OneOnOneSchedule): string {
  const day = weekdayName(schedule.weekday);
  if (schedule.cadence === 'ONCE') {
    return `Once, on ${describeDay(schedule.startsOn)}`;
  }
  if (schedule.cadence === 'MONTHLY') {
    const ordinal = ORDINALS[weekOfMonth(schedule.startsOn) - 1] ?? 'first';
    return `Monthly on the ${ordinal} ${day}`;
  }
  return `${CADENCE_WORDS[schedule.cadence]} on ${day}`;
}

/** The short form a card has room for: "Thu · weekly", or "Wed 2 Dec · once". */
export function describeScheduleShort(schedule: OneOnOneSchedule): string {
  if (schedule.cadence === 'ONCE') {
    return `${describeDay(schedule.startsOn)} · once`;
  }
  const day =
    WEEKDAYS.find((weekday) => weekday.value === schedule.weekday)?.short ?? '';
  return `${day} · ${CADENCE_WORDS[schedule.cadence].toLowerCase()}`;
}

const TIME_OF_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: SCHEDULE_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "16:50" for an instant, on the schedule's clock. */
export function describeTime(instant: string): string {
  return TIME_OF_DAY.format(new Date(instant));
}

const CALENDAR_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** "Thu 26 Nov" for a `YYYY-MM-DD` calendar day, which names a day rather than an instant. */
export function describeDay(day: string): string {
  return CALENDAR_DAY.format(new Date(`${day}T00:00:00.000Z`));
}

const DAY_OF_INSTANT = new Intl.DateTimeFormat('en-GB', {
  timeZone: SCHEDULE_TIME_ZONE,
  day: 'numeric',
  month: 'short',
});

const MEETING_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: SCHEDULE_TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/**
 * "Thu 26 Nov" for an instant, on the schedule's clock: the day a meeting is, or was, held. A 1:1
 * is kept by the day, so a meeting names no time.
 */
export function describeMeeting(instant: string): string {
  return MEETING_DAY.format(new Date(instant));
}

/** "26 Nov" for an instant, on the schedule's clock. */
export function describeCalendarDay(instant: string): string {
  return DAY_OF_INSTANT.format(new Date(instant));
}

/** How long a 1:1 that was turned down stays in its starter's list, as the API keeps it. */
const DECLINED_LISTED_FOR_DAYS = 14;

/** The day a 1:1 turned down at `answeredAt` leaves its starter's list: "10 Dec". */
export function leavesListOn(answeredAt: string): string {
  const leaves = new Date(
    Date.parse(answeredAt) + DECLINED_LISTED_FOR_DAYS * 24 * 60 * 60 * 1000,
  );
  return DAY_OF_INSTANT.format(leaves);
}

/** A schedule as a choice, to start a form from what is set. */
export function choiceOf(schedule: OneOnOneSchedule): OneOnOneScheduleChoice {
  return {
    cadence: schedule.cadence,
    weekday: schedule.weekday,
    ...(schedule.cadence === 'ONCE' ? { startsOn: schedule.startsOn } : {}),
  };
}

const BANGKOK_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: SCHEDULE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today on the schedule's clock, `YYYY-MM-DD`: the first day a meeting held just once may take. */
export function todayInBangkok(now: Date = new Date()): string {
  return BANGKOK_DAY.format(now);
}

/** The day an instant falls on, on the schedule's clock, `YYYY-MM-DD`. */
export function dayInBangkok(instant: string): string {
  return BANGKOK_DAY.format(new Date(instant));
}

/** 1 for Monday through 7 for Sunday, for a `YYYY-MM-DD` day, as the API counts them. */
export function weekdayOfDay(day: string): number {
  return new Date(`${day}T00:00:00.000Z`).getUTCDay() || 7;
}

/** The first day on or after `from` (`YYYY-MM-DD`) that falls on `weekday`. */
export function nextDayOn(weekday: number, from: string): string {
  const date = new Date(`${from}T00:00:00.000Z`);
  while ((date.getUTCDay() || 7) !== weekday) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

/** The day `days` before `day`, both `YYYY-MM-DD`. */
export function daysBefore(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * When a day (`YYYY-MM-DD`) begins on the schedule's clock, as an instant. Bangkok keeps one offset
 * all year, with no daylight saving, so the day's start is its date at 00:00 +07:00.
 */
export function startOfDayInBangkok(day: string): string {
  return new Date(`${day}T00:00:00.000+07:00`).toISOString();
}
