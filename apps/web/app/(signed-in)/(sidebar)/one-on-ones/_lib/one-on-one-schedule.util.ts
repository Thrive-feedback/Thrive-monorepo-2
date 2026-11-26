import type {
  OneOnOneCadence,
  OneOnOneSchedule,
  OneOnOneScheduleChoice,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { timeLabel } from '@/lib/time-of-day.util';

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

export const LENGTHS: readonly number[] = [15, 20, 30, 45, 60];

const ORDINALS = ['first', 'second', 'third', 'fourth'] as const;

/** What a new 1:1 starts at: weekly, on Thursdays at 10:00, for 30 minutes, the weekly check-in. */
export const DEFAULT_SCHEDULE: OneOnOneScheduleChoice = {
  cadence: 'WEEKLY',
  weekday: 4,
  startMinute: 10 * 60,
  lengthMinutes: 30,
  templateKey: 'weekly-check-in',
};

/** `10:00` for 600: a schedule's start, written as the time picker writes it. */
export const timeOf = timeLabel;

/** 600 for `10:00`, or `null` for anything that is not a time of day. */
export function minuteOf(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

function weekdayName(weekday: number): string {
  return WEEKDAYS.find((day) => day.value === weekday)?.name ?? '';
}

/** Which week of its month a `YYYY-MM-DD` day falls in, as the API counts it. */
function weekOfMonth(day: string): number {
  return Math.ceil(Number(day.slice(8, 10)) / 7);
}

/**
 * The schedule said as a sentence: "Weekly on Thursday at 10:00", "Every 2 weeks on Monday at
 * 09:00", "Monthly on the second Friday at 16:00", "Once, on Wed 2 Dec at 11:00".
 */
export function describeSchedule(schedule: OneOnOneSchedule): string {
  const day = weekdayName(schedule.weekday);
  const at = timeOf(schedule.startMinute);
  if (schedule.cadence === 'ONCE') {
    return `Once, on ${describeDay(schedule.startsOn)} at ${at}`;
  }
  if (schedule.cadence === 'MONTHLY') {
    const ordinal = ORDINALS[weekOfMonth(schedule.startsOn) - 1] ?? 'first';
    return `Monthly on the ${ordinal} ${day} at ${at}`;
  }
  return `${CADENCE_WORDS[schedule.cadence]} on ${day} at ${at}`;
}

/** The short form a card has room for: "Thu 10:00 · weekly", or "Wed 2 Dec, 11:00 · once". */
export function describeScheduleShort(schedule: OneOnOneSchedule): string {
  if (schedule.cadence === 'ONCE') {
    return `${describeDay(schedule.startsOn)}, ${timeOf(schedule.startMinute)} · once`;
  }
  const day =
    WEEKDAYS.find((weekday) => weekday.value === schedule.weekday)?.short ?? '';
  return `${day} ${timeOf(schedule.startMinute)} · ${CADENCE_WORDS[schedule.cadence].toLowerCase()}`;
}

const NEXT_MEETING = new Intl.DateTimeFormat('en-GB', {
  timeZone: SCHEDULE_TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "Thu 27 Nov, 10:00" for an instant, on the schedule's clock. */
export function describeMeeting(instant: string): string {
  return NEXT_MEETING.format(new Date(instant));
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

/** "Thu 26 Nov" for an instant, on the schedule's clock: the day a meeting was held. */
export function describeMeetingDay(instant: string): string {
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
    startMinute: schedule.startMinute,
    lengthMinutes: schedule.lengthMinutes,
    templateKey: schedule.templateKey,
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
