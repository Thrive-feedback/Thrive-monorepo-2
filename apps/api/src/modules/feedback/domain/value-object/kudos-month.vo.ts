/**
 * The clock a month of Kudos is read on: one fixed offset for everyone, so a Kudos sits in the same
 * month for every Member (ADR 0076). Thailand keeps no daylight saving, so it never changes.
 */
export const KUDOS_MONTH_UTC_OFFSET_HOURS = 7;

/** The instants one month of Kudos runs between: `from` is in it and `until` is not. */
export interface KudosMonthRange {
  readonly from: Date;
  readonly until: Date;
}

/** One calendar month, `YYYY-MM`, on that clock. The request schema has checked its shape. */
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
  range(): KudosMonthRange {
    return {
      from: this.startOf(this.monthIndex),
      until: this.startOf(this.monthIndex + 1),
    };
  }

  private startOf(monthIndex: number): Date {
    return new Date(
      Date.UTC(this.year, monthIndex, 1, -KUDOS_MONTH_UTC_OFFSET_HOURS),
    );
  }
}
