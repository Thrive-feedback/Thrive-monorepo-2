import {
  CALENDAR_UTC_OFFSET_HOURS,
  type InstantRange,
} from './calendar-clock.vo';

/**
 * One calendar month, `YYYY-MM`, on the one clock every calendar is read on, so a Kudos sits in the
 * same month for every Member (ADR 0076). The request schema has checked its shape.
 */
export class KudosMonth {
  private constructor(
    private readonly year: number,
    private readonly monthIndex: number,
  ) {}

  static of(value: string): KudosMonth {
    const [year, month] = value.split('-');
    return new KudosMonth(Number(year), Number(month) - 1);
  }

  /** `Date.UTC` carries a month past December, and an hour before midnight, into the right day. */
  range(): InstantRange {
    return {
      from: this.startOf(this.monthIndex),
      until: this.startOf(this.monthIndex + 1),
    };
  }

  private startOf(monthIndex: number): Date {
    return new Date(
      Date.UTC(this.year, monthIndex, 1, -CALENDAR_UTC_OFFSET_HOURS),
    );
  }
}
