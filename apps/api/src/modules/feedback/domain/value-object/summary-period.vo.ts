/** The instants one period runs between: `from` is in it and `until` is not. */
export interface SummaryPeriodRange {
  readonly from: Date;
  readonly until: Date;
}

const MONTHS_IN_A_QUARTER = 3;

const PERIOD = /^(\d{4})-Q([1-4])$/;

/**
 * One quarter, `YYYY-Qn`, on UTC (design 0025 D2).
 *
 * A quarter rather than a month because a month regenerates often and reads thin, and it is what
 * makes "what changed since last time" possible later with no migration. It is the one place in
 * Feedback that slices time on UTC rather than the Kudos board's fixed +7 (ADR 0076): nothing
 * here is a list a Member scrolls by date, so the two never sit side by side, and a boundary
 * seven hours out moves at most one message between two summaries of the same person.
 */
export class SummaryPeriod {
  private constructor(
    private readonly year: number,
    private readonly quarter: number,
  ) {}

  /** Rejects anything that is not `YYYY-Qn`, so a period cannot reach a query unchecked. */
  static of(value: string): SummaryPeriod {
    const matched = PERIOD.exec(value);
    if (matched === null) {
      throw new Error('A period is written YYYY-Qn');
    }
    return new SummaryPeriod(Number(matched[1]), Number(matched[2]));
  }

  /** The period an instant falls in — what "now" means when nobody named one. */
  static containing(instant: Date): SummaryPeriod {
    return new SummaryPeriod(
      instant.getUTCFullYear(),
      Math.floor(instant.getUTCMonth() / MONTHS_IN_A_QUARTER) + 1,
    );
  }

  range(): SummaryPeriodRange {
    return {
      from: this.startOf(this.quarter),
      until: this.startOf(this.quarter + 1),
    };
  }

  toString(): string {
    return `${this.year}-Q${this.quarter}`;
  }

  /** `Date.UTC` carries a fifth quarter into January of the next year on its own. */
  private startOf(quarter: number): Date {
    return new Date(
      Date.UTC(this.year, (quarter - 1) * MONTHS_IN_A_QUARTER, 1),
    );
  }
}
