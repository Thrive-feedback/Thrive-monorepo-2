import { OneOnOneScheduleInvalidError } from '../one-on-one.errors';
import { templateRefOf } from './one-on-one-template-ref.vo';

export const ONE_ON_ONE_CADENCES = [
  'WEEKLY',
  'EVERY_TWO_WEEKS',
  'MONTHLY',
  'ONCE',
] as const;

export type OneOnOneCadence = (typeof ONE_ON_ONE_CADENCES)[number];

/**
 * The calendar clock a schedule is kept on: the one fixed offset every Member reads a calendar on
 * (Feedback's `CALENDAR_UTC_OFFSET_HOURS`, ADR 0095). Held here as well because a domain imports
 * nothing outside itself; the two change together, when a Workspace time zone replaces both.
 */
const CALENDAR_UTC_OFFSET_HOURS = 7;

const MS_IN_A_DAY = 24 * 60 * 60_000;
const OFFSET_MS = CALENDAR_UTC_OFFSET_HOURS * 60 * 60_000;
/** How many days a meeting held once stays overdue before it is skipped and the 1:1 is over. */
export const ONE_ON_ONE_ONCE_OVERDUE_DAYS = 7;
/** Far enough ahead that any cadence has met at least once. */
const DAYS_LOOKED_AHEAD = 70;
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * What somebody chooses: how often, on which weekday, from which template. A 1:1 is kept by the
 * day, with no time of day: a meeting is that whole day. A meeting held just once names its day
 * instead, and its weekday follows from it.
 */
export interface OneOnOneScheduleChoice {
  readonly cadence: string;
  /** 1 is Monday and 7 is Sunday. Ignored for one held just once, which takes its day's. */
  readonly weekday: number;
  readonly templateKey: string;
  /** The day of a meeting held just once, `YYYY-MM-DD`; ignored for the other cadences. */
  readonly startsOn?: string;
}

export interface OneOnOneScheduleSnapshot {
  readonly cadence: OneOnOneCadence;
  readonly weekday: number;
  readonly templateKey: string;
  /** The calendar day of the first meeting, `YYYY-MM-DD`. */
  readonly startsOn: string;
}

/** Days since 1970-01-01 in the calendar clock: a day number, so days are counted, never timed. */
function dayOf(instant: Date): number {
  return Math.floor((instant.getTime() + OFFSET_MS) / MS_IN_A_DAY);
}

/** The calendar day an instant falls on, on the calendar clock, `YYYY-MM-DD`. */
export function calendarDayOf(instant: Date): string {
  return dayToText(dayOf(instant));
}

function dayFromText(text: string): number {
  const match = DAY_PATTERN.exec(text);
  if (!match) {
    throw new OneOnOneScheduleInvalidError('its first day is not a date.');
  }
  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day)) / MS_IN_A_DAY;
}

function dayToText(day: number): string {
  return new Date(day * MS_IN_A_DAY).toISOString().slice(0, 10);
}

/** 1 for Monday through 7 for Sunday. */
function weekdayOf(day: number): number {
  return new Date(day * MS_IN_A_DAY).getUTCDay() || 7;
}

/** Which week of its month a day falls in: the 1st to 7th are 1, the 8th to 14th are 2, and so on. */
function weekOfMonthOf(day: number): number {
  return Math.ceil(new Date(day * MS_IN_A_DAY).getUTCDate() / 7);
}

function isCadence(raw: string): raw is OneOnOneCadence {
  return (ONE_ON_ONE_CADENCES as readonly string[]).includes(raw);
}

/**
 * When a 1:1 meets, on the calendar clock: weekly; every two weeks from its first meeting; monthly on
 * the same week of the month as its first meeting — the second Thursday, say; or just once, on one
 * day. A monthly one never starts in a month's fifth week, which some months lack. The first meeting's
 * day is fixed when the schedule is set, so every later one follows from it.
 */
export class OneOnOneSchedule {
  private constructor(
    private readonly cadence: OneOnOneCadence,
    private readonly weekday: number,
    private readonly templateKey: string,
    private readonly startsOn: number,
  ) {}

  /**
   * A schedule chosen now, whose first meeting is the first that falls at or after `from`. One held
   * just once meets on the day it names, which must not have passed. Whether its template may be
   * chosen is for the use case to ask the template catalog, as kept templates live in the database.
   */
  static plan(choice: OneOnOneScheduleChoice, from: Date): OneOnOneSchedule {
    const { cadence, weekday, templateKey } = OneOnOneSchedule.check(choice);
    // A Thrive key or a kept id; whether that template may be chosen is the catalog's to ask.
    templateRefOf(templateKey);
    if (cadence === 'ONCE') {
      if (choice.startsOn === undefined) {
        throw new OneOnOneScheduleInvalidError(
          'a meeting held once needs its day.',
        );
      }
      const once = dayFromText(choice.startsOn);
      const schedule = new OneOnOneSchedule(
        cadence,
        weekdayOf(once),
        templateKey,
        once,
      );
      if (once < dayOf(from)) {
        throw new OneOnOneScheduleInvalidError('its day has passed.');
      }
      return schedule;
    }
    // Today counts while it lasts: a meeting is the whole of its day.
    let day = dayOf(from);
    while (
      weekdayOf(day) !== weekday ||
      (cadence === 'MONTHLY' && weekOfMonthOf(day) > 4)
    ) {
      day += 1;
    }
    return new OneOnOneSchedule(cadence, weekday, templateKey, day);
  }

  /** Rebuilds one already stored; only the repository calls this. */
  static restore(snapshot: OneOnOneScheduleSnapshot): OneOnOneSchedule {
    const { cadence, weekday, templateKey } = OneOnOneSchedule.check(snapshot);
    return new OneOnOneSchedule(
      cadence,
      weekday,
      templateKey,
      dayFromText(snapshot.startsOn),
    );
  }

  private static check(
    choice: OneOnOneScheduleChoice,
  ): OneOnOneScheduleChoice & {
    readonly cadence: OneOnOneCadence;
  } {
    if (!isCadence(choice.cadence)) {
      throw new OneOnOneScheduleInvalidError(
        'it meets weekly, every two weeks, monthly or just once.',
      );
    }
    if (
      !Number.isInteger(choice.weekday) ||
      choice.weekday < 1 ||
      choice.weekday > 7
    ) {
      throw new OneOnOneScheduleInvalidError('its weekday is not a day.');
    }
    if (choice.templateKey.trim() === '') {
      throw new OneOnOneScheduleInvalidError('it starts from a template.');
    }
    return { ...choice, cadence: choice.cadence };
  }

  /** Whether a meeting falls on this day number. */
  private meetsOn(day: number): boolean {
    if (day < this.startsOn || weekdayOf(day) !== this.weekday) {
      return false;
    }
    switch (this.cadence) {
      case 'ONCE':
        return day === this.startsOn;
      case 'WEEKLY':
        return true;
      case 'EVERY_TWO_WEEKS':
        return (day - this.startsOn) % 14 === 0;
      case 'MONTHLY':
        return weekOfMonthOf(day) === weekOfMonthOf(this.startsOn);
    }
  }

  /** When a day starts on the calendar clock: a meeting is the whole of it. */
  private startOf(day: number): Date {
    return new Date(day * MS_IN_A_DAY - OFFSET_MS);
  }

  /** The first meeting day on or after `from`. Recurring only: each meets within any 70 days. */
  private firstFrom(from: number): number {
    const first = Math.max(from, this.startsOn);
    for (let day = first; day <= first + DAYS_LOOKED_AHEAD; day += 1) {
      if (this.meetsOn(day)) {
        return day;
      }
    }
    throw new OneOnOneScheduleInvalidError('it never meets.');
  }

  /**
   * The meeting day now due, given the day the last meeting held counted for (`null` if none was):
   * the latest meeting day that has come since then, overdue while it is before today, or the next
   * one still to come. A meeting held under a schedule since changed counts for nothing here: the
   * new one starts from its own first day. `null` when nothing is due: a one-time 1:1 met, or a week
   * past its day.
   */
  dueAt(now: Date, lastHeldFor: Date | null): Date | null {
    const today = dayOf(now);
    if (this.cadence === 'ONCE') {
      return lastHeldFor === null &&
        today < this.startsOn + ONE_ON_ONE_ONCE_OVERDUE_DAYS
        ? this.startOf(this.startsOn)
        : null;
    }
    const candidate =
      lastHeldFor !== null && this.meetsOn(dayOf(lastHeldFor))
        ? this.firstFrom(dayOf(lastHeldFor) + 1)
        : this.startsOn;
    if (candidate > today) {
      return this.startOf(candidate);
    }
    let due = candidate;
    for (let day = candidate + 1; day <= today; day += 1) {
      if (this.meetsOn(day)) {
        due = day;
      }
    }
    return this.startOf(due);
  }

  /**
   * When the meeting due on `due` is skipped, if nobody starts it: the next meeting day, or a week
   * after its day for one held once.
   */
  skippedAt(due: Date): Date {
    const day = dayOf(due);
    return this.startOf(
      this.cadence === 'ONCE'
        ? day + ONE_ON_ONE_ONCE_OVERDUE_DAYS
        : this.firstFrom(day + 1),
    );
  }

  /**
   * The meeting days skipped by `now`, as `YYYY-MM-DD`: each it met on, from its first until the one
   * due, that no meeting was held for. Worked out, never stored, as a skip is only days passing.
   */
  skippedDays(now: Date, heldFor: readonly Date[]): string[] {
    const held = new Set(heldFor.map(dayOf));
    const lastHeldFor = this.lastHeldOn(heldFor);
    const due = this.dueAt(now, lastHeldFor);
    if (this.cadence === 'ONCE') {
      return due === null && !held.has(this.startsOn)
        ? [dayToText(this.startsOn)]
        : [];
    }
    const until = due === null ? this.startsOn : dayOf(due);
    const skipped: string[] = [];
    for (let day = this.startsOn; day < until; day += 1) {
      if (this.meetsOn(day) && !held.has(day)) {
        skipped.push(dayToText(day));
      }
    }
    return skipped;
  }

  /**
   * The days skipped once this schedule closes at `now`, changed or ended: those skipped so far,
   * and the one due if it is overdue and nobody started it.
   */
  skippedDaysClosingAt(
    now: Date,
    heldFor: readonly Date[],
    hasMeetingInProgress: boolean,
  ): string[] {
    const skipped = this.skippedDays(now, heldFor);
    const lastHeldFor = this.lastHeldOn(heldFor);
    const due = this.dueAt(now, lastHeldFor);
    if (due !== null && !hasMeetingInProgress && dayOf(due) < dayOf(now)) {
      skipped.push(dayToText(dayOf(due)));
    }
    return skipped;
  }

  /**
   * The day the last meeting held under this schedule counted for: the latest of `heldFor` on a day
   * it meets. A one-time 1:1 has met if any was held.
   */
  lastHeldOn(heldFor: readonly Date[]): Date | null {
    return heldFor.reduce<Date | null>(
      (latest, each) =>
        (this.isOnce() || this.meetsOn(dayOf(each))) &&
        (latest === null || each > latest)
          ? each
          : latest,
      null,
    );
  }

  /**
   * The same schedule, its first meeting the first of its days on or after `at`: an invitation
   * accepted later counts its meetings from then, keeping every second week and the week of the
   * month. One held once keeps its day.
   */
  startingFrom(at: Date): OneOnOneSchedule {
    if (this.isOnce()) {
      return this;
    }
    return new OneOnOneSchedule(
      this.cadence,
      this.weekday,
      this.templateKey,
      this.firstFrom(dayOf(at)),
    );
  }

  /** Whether it is held once and its day has passed: an invitation to it can no longer be accepted. */
  hasDayPassedAt(instant: Date): boolean {
    return this.isOnce() && dayOf(instant) > this.startsOn;
  }

  /**
   * The meeting day a topic added at `addedAt` was written for, if that day has been skipped by
   * `now`, as `YYYY-MM-DD`: the agenda moved on from it. `closing` counts the day due as skipped too
   * when it is overdue, as a change of schedule does. A topic written before this schedule's first
   * day was written for that first day. One written under a schedule since changed keeps what it was
   * carried from on itself, from the change.
   */
  carriedFrom(
    addedAt: Date,
    now: Date,
    heldFor: readonly Date[],
    closing = false,
  ): string | null {
    const due = this.dueAt(addedAt, this.lastHeldOn(heldFor));
    if (due === null) {
      return null;
    }
    const day = dayToText(dayOf(due));
    const skipped = closing
      ? this.skippedDaysClosingAt(now, heldFor, false)
      : this.skippedDays(now, heldFor);
    return skipped.includes(day) ? day : null;
  }

  /**
   * Whether it was held just once and is over: a week past its day, and nobody started it. A
   * recurring one is never over; one held once and met is over by its finished meeting, which the
   * 1:1 asks about itself.
   */
  isOverAt(instant: Date): boolean {
    return (
      this.isOnce() &&
      dayOf(instant) >= this.startsOn + ONE_ON_ONE_ONCE_OVERDUE_DAYS
    );
  }

  /** Whether it is held just once rather than on a repeat. */
  isOnce(): boolean {
    return this.cadence === 'ONCE';
  }

  snapshot(): OneOnOneScheduleSnapshot {
    return {
      cadence: this.cadence,
      weekday: this.weekday,
      templateKey: this.templateKey,
      startsOn: dayToText(this.startsOn),
    };
  }
}
