import type { FeedbackOrigin } from '../entity/feedback.entity';
import {
  CALENDAR_UTC_OFFSET_HOURS,
  type InstantRange,
} from './calendar-clock.vo';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const OFFSET_MS = CALENDAR_UTC_OFFSET_HOURS * HOUR_MS;

/**
 * One calendar day, `YYYY-MM-DD`, on the one clock every calendar is read on (ADR 0095). The clock
 * keeps no daylight saving, so every day is exactly twenty-four hours, and a day is the instant it
 * starts.
 */
export class CalendarDay {
  private constructor(private readonly startsAt: number) {}

  /** The day an instant falls on: 23:30 UTC is already the next morning on this clock. */
  static containing(instant: Date): CalendarDay {
    const onTheClock = instant.getTime() + OFFSET_MS;
    return new CalendarDay(
      Math.floor(onTheClock / DAY_MS) * DAY_MS - OFFSET_MS,
    );
  }

  /** A day named `YYYY-MM-DD`. Whoever calls this has checked the shape. */
  static of(value: string): CalendarDay {
    return new CalendarDay(Date.parse(`${value}T00:00:00.000Z`) - OFFSET_MS);
  }

  minusDays(count: number): CalendarDay {
    return new CalendarDay(this.startsAt - count * DAY_MS);
  }

  range(): InstantRange {
    return {
      from: new Date(this.startsAt),
      until: new Date(this.startsAt + DAY_MS),
    };
  }

  toString(): string {
    return new Date(this.startsAt + OFFSET_MS).toISOString().slice(0, 10);
  }
}

/** When a piece of Feedback was given, and whether it answered an Ask. */
export interface FeedbackMoment {
  readonly origin: FeedbackOrigin;
  readonly createdAt: Date;
}

/** How much of each kind one day holds. */
export interface DayCount {
  /** `YYYY-MM-DD`, on the clock. */
  readonly day: string;
  /** Feedback given without being asked. */
  readonly offeredFeedback: number;
  /** Feedback written to answer an Ask. */
  readonly requestedFeedback: number;
  readonly kudos: number;
}

/**
 * The last few days up to and including one, oldest first. Every day is counted, the empty ones
 * too, because a day with nothing in it is something the reader is shown.
 */
export class RecentDays {
  private constructor(private readonly days: readonly CalendarDay[]) {}

  static endingOn(lastDay: CalendarDay, length: number): RecentDays {
    return new RecentDays(
      Array.from({ length }, (_, index) =>
        lastDay.minusDays(length - 1 - index),
      ),
    );
  }

  /** From the start of the first day to the end of the last: what a read has to cover. */
  range(): InstantRange {
    const first = this.days[0];
    const last = this.days[this.days.length - 1];
    if (first === undefined || last === undefined) {
      throw new Error('RecentDays holds at least one day');
    }
    return { from: first.range().from, until: last.range().until };
  }

  /** Each day's count, oldest first. Anything outside the days is left out rather than moved in. */
  count(
    feedback: readonly FeedbackMoment[],
    kudos: readonly Date[],
  ): readonly DayCount[] {
    const counts = new Map(
      this.days.map((day) => [
        day.toString(),
        { offeredFeedback: 0, requestedFeedback: 0, kudos: 0 },
      ]),
    );
    for (const { origin, createdAt } of feedback) {
      const count = counts.get(CalendarDay.containing(createdAt).toString());
      if (count === undefined) {
        continue;
      }
      if (origin === 'OFFERED') {
        count.offeredFeedback += 1;
      } else {
        count.requestedFeedback += 1;
      }
    }
    for (const createdAt of kudos) {
      const count = counts.get(CalendarDay.containing(createdAt).toString());
      if (count !== undefined) {
        count.kudos += 1;
      }
    }
    return [...counts].map(([day, count]) => ({ day, ...count }));
  }
}
