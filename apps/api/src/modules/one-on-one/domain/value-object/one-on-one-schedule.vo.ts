import { OneOnOneScheduleInvalidError } from '../one-on-one.errors';
import { templateRefOf } from './one-on-one-template-ref.vo';

export const ONE_ON_ONE_CADENCES = [
  'WEEKLY',
  'EVERY_TWO_WEEKS',
  'MONTHLY',
  'ONCE',
] as const;

export type OneOnOneCadence = (typeof ONE_ON_ONE_CADENCES)[number];

/** How long a meeting may be booked for, in minutes. */
export const ONE_ON_ONE_LENGTHS = [15, 20, 30, 45, 60] as const;

/**
 * The calendar clock a schedule is kept on: the one fixed offset every Member reads a calendar on
 * (Feedback's `CALENDAR_UTC_OFFSET_HOURS`, ADR 0095). Held here as well because a domain imports
 * nothing outside itself; the two change together, when a Workspace time zone replaces both.
 */
const CALENDAR_UTC_OFFSET_HOURS = 7;

const MINUTES_IN_A_DAY = 24 * 60;
const MS_IN_A_MINUTE = 60_000;
const MS_IN_A_DAY = MINUTES_IN_A_DAY * MS_IN_A_MINUTE;
const OFFSET_MS = CALENDAR_UTC_OFFSET_HOURS * 60 * MS_IN_A_MINUTE;
/** Far enough ahead that any cadence has met at least once. */
const DAYS_LOOKED_AHEAD = 70;
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * What somebody chooses: how often, on which weekday, from what time, for how long, from which
 * template. A meeting held just once names its day instead, and its weekday follows from it.
 */
export interface OneOnOneScheduleChoice {
  readonly cadence: string;
  /** 1 is Monday and 7 is Sunday. Ignored for one held just once, which takes its day's. */
  readonly weekday: number;
  /** Minutes after midnight in the calendar clock. */
  readonly startMinute: number;
  readonly lengthMinutes: number;
  readonly templateKey: string;
  /** The day of a meeting held just once, `YYYY-MM-DD`; ignored for the other cadences. */
  readonly startsOn?: string;
}

export interface OneOnOneScheduleSnapshot {
  readonly cadence: OneOnOneCadence;
  readonly weekday: number;
  readonly startMinute: number;
  readonly lengthMinutes: number;
  readonly templateKey: string;
  /** The calendar day of the first meeting, `YYYY-MM-DD`. */
  readonly startsOn: string;
}

/** Days since 1970-01-01 in the calendar clock: a day number, so days are counted, never timed. */
function dayOf(instant: Date): number {
  return Math.floor((instant.getTime() + OFFSET_MS) / MS_IN_A_DAY);
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
    private readonly startMinute: number,
    private readonly lengthMinutes: number,
    private readonly templateKey: string,
    private readonly startsOn: number,
  ) {}

  /**
   * A schedule chosen now, whose first meeting is the first that falls at or after `from`. One held
   * just once meets on the day it names, which must not have passed. Whether its template may be
   * chosen is for the use case to ask the template catalog, as kept templates live in the database.
   */
  static plan(choice: OneOnOneScheduleChoice, from: Date): OneOnOneSchedule {
    const { cadence, weekday, startMinute, lengthMinutes, templateKey } =
      OneOnOneSchedule.check(choice);
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
        startMinute,
        lengthMinutes,
        templateKey,
        once,
      );
      if (schedule.startOf(once) < from) {
        throw new OneOnOneScheduleInvalidError('its day has passed.');
      }
      return schedule;
    }
    let day = dayOf(from);
    const minuteNow = Math.floor(
      ((from.getTime() + OFFSET_MS) % MS_IN_A_DAY) / MS_IN_A_MINUTE,
    );
    const firstIsToday = weekdayOf(day) === weekday && startMinute >= minuteNow;
    if (!firstIsToday) {
      day += 1;
    }
    while (
      weekdayOf(day) !== weekday ||
      (cadence === 'MONTHLY' && weekOfMonthOf(day) > 4)
    ) {
      day += 1;
    }
    return new OneOnOneSchedule(
      cadence,
      weekday,
      startMinute,
      lengthMinutes,
      templateKey,
      day,
    );
  }

  /** Rebuilds one already stored; only the repository calls this. */
  static restore(snapshot: OneOnOneScheduleSnapshot): OneOnOneSchedule {
    const { cadence, weekday, startMinute, lengthMinutes, templateKey } =
      OneOnOneSchedule.check(snapshot);
    return new OneOnOneSchedule(
      cadence,
      weekday,
      startMinute,
      lengthMinutes,
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
    if (
      !Number.isInteger(choice.startMinute) ||
      choice.startMinute < 0 ||
      choice.startMinute >= MINUTES_IN_A_DAY
    ) {
      throw new OneOnOneScheduleInvalidError('its time is not in a day.');
    }
    if (
      !(ONE_ON_ONE_LENGTHS as readonly number[]).includes(choice.lengthMinutes)
    ) {
      throw new OneOnOneScheduleInvalidError(
        `it lasts ${ONE_ON_ONE_LENGTHS.join(', ')} minutes.`,
      );
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

  private startOf(day: number): Date {
    return new Date(
      day * MS_IN_A_DAY + this.startMinute * MS_IN_A_MINUTE - OFFSET_MS,
    );
  }

  /**
   * When the first meeting that starts at or after `instant` starts, or `null` for one held just
   * once whose day has gone.
   */
  nextAtOrAfter(instant: Date): Date | null {
    const first = Math.max(this.startsOn, dayOf(instant));
    for (let day = first; day <= first + DAYS_LOOKED_AHEAD; day += 1) {
      if (this.meetsOn(day) && this.startOf(day) >= instant) {
        return this.startOf(day);
      }
    }
    if (this.cadence === 'ONCE') {
      return null;
    }
    // Unreachable for the recurring cadences: each meets within any 70 days.
    throw new OneOnOneScheduleInvalidError('it never meets.');
  }

  /**
   * When the meeting to show as the next one starts: the first that has not ended by `instant`, so
   * one in progress still counts. `null` once a meeting held just once is over.
   */
  upcomingAt(instant: Date): Date | null {
    return this.nextAtOrAfter(
      new Date(instant.getTime() - this.lengthMinutes * MS_IN_A_MINUTE + 1),
    );
  }

  /** Whether it was held just once and that meeting has ended; a recurring one is never over. */
  isOverAt(instant: Date): boolean {
    return this.isOnce() && this.upcomingAt(instant) === null;
  }

  /** Whether it is held just once rather than on a repeat. */
  isOnce(): boolean {
    return this.cadence === 'ONCE';
  }

  snapshot(): OneOnOneScheduleSnapshot {
    return {
      cadence: this.cadence,
      weekday: this.weekday,
      startMinute: this.startMinute,
      lengthMinutes: this.lengthMinutes,
      templateKey: this.templateKey,
      startsOn: dayToText(this.startsOn),
    };
  }
}
