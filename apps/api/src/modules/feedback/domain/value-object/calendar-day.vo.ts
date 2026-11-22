import type { FeedbackOrigin } from '../entity/feedback.entity';
import {
  CALENDAR_UTC_OFFSET_HOURS,
  type InstantRange,
} from './calendar-clock.vo';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const OFFSET_MS = CALENDAR_UTC_OFFSET_HOURS * HOUR_MS;
const A_DATE = /^\d{4}-\d{2}-\d{2}$/;

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

  /** A day named `YYYY-MM-DD`. Anything else is not a day, and is refused rather than guessed at. */
  static of(value: string): CalendarDay {
    const midnight = Date.parse(`${value}T00:00:00.000Z`);
    const day = new CalendarDay(midnight - OFFSET_MS);
    // A date the calendar does not hold, such as 30 February, parses into the next month: written
    // back out, it is no longer the day asked for.
    if (
      !A_DATE.test(value) ||
      Number.isNaN(midnight) ||
      day.toString() !== value
    ) {
      throw new RangeError(`"${value}" is not a day`);
    }
    return day;
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

/** How much of each kind some stretch of Home held. */
export interface KindCounts {
  /** Feedback given without being asked. */
  readonly offeredFeedback: number;
  /** Feedback written to answer an Ask. */
  readonly requestedFeedback: number;
  readonly kudos: number;
}

/** How much of each kind one day held. */
export interface DayCount extends KindCounts {
  readonly day: CalendarDay;
}

const NONE: KindCounts = { offeredFeedback: 0, requestedFeedback: 0, kudos: 0 };

/** The count a piece of Feedback adds to, by how it came about. */
function kindOf(
  origin: FeedbackOrigin,
): 'offeredFeedback' | 'requestedFeedback' {
  switch (origin) {
    case 'OFFERED':
      return 'offeredFeedback';
    case 'REQUESTED':
      return 'requestedFeedback';
  }
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

  /**
   * Each day's count, oldest first, from when each piece of Feedback and each Kudos was given.
   * Anything outside the days is left out rather than moved in.
   */
  count(
    feedback: readonly {
      readonly origin: FeedbackOrigin;
      readonly createdAt: Date;
    }[],
    kudos: readonly Date[],
  ): readonly DayCount[] {
    const counts = new Map(
      this.days.map((day) => [day.toString(), { day, ...NONE }]),
    );
    for (const { origin, createdAt } of feedback) {
      const count = counts.get(CalendarDay.containing(createdAt).toString());
      if (count) {
        count[kindOf(origin)] += 1;
      }
    }
    for (const createdAt of kudos) {
      const count = counts.get(CalendarDay.containing(createdAt).toString());
      if (count) {
        count.kudos += 1;
      }
    }
    return [...counts.values()];
  }

  /** Days' counts added up. */
  static total(days: readonly KindCounts[]): KindCounts {
    return days.reduce(
      (total, day) => ({
        offeredFeedback: total.offeredFeedback + day.offeredFeedback,
        requestedFeedback: total.requestedFeedback + day.requestedFeedback,
        kudos: total.kudos + day.kudos,
      }),
      NONE,
    );
  }
}
