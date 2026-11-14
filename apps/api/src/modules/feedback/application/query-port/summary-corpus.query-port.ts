import type { SummaryPeriodRange } from '../../domain/value-object/summary-period.vo';

/** One thing somebody wrote to this Member. Words and an id; no names, no Visibility. */
export interface SummarySourceRow {
  readonly id: string;
  readonly kind: 'FEEDBACK' | 'KUDOS';
  readonly message: string;
  readonly createdAt: Date;
}

export abstract class SummaryCorpusQuery {
  /**
   * Everything written to one Member in one period: every Feedback they received, asked for or
   * offered, plus every Kudos naming them. Oldest first.
   *
   * **No Visibility filter, deliberately** (design 0025 D11): Visibility governs who *else* may
   * read a Feedback and never hides one from its own Receiver, so filtering here would drop
   * messages from the summary of the very person they were written for.
   *
   * Nobody's name is read. The model is given words and ids, so a point it writes cites a
   * message rather than a person.
   */
  abstract writtenTo(
    workspaceId: string,
    accountId: string,
    within: SummaryPeriodRange,
    /** At most this many, the newest kept. Answered oldest first whatever the limit. */
    limit: number,
  ): Promise<readonly SummarySourceRow[]>;

  /**
   * How much was written to one Member in a period and when the newest of it arrived — without
   * reading a word of it. The read path asks this to tell a current summary from a stale one,
   * and asking {@link writtenTo} for that would load the whole corpus on every page view.
   */
  abstract freshnessOf(
    workspaceId: string,
    accountId: string,
    within: SummaryPeriodRange,
  ): Promise<SummaryCorpusFreshness>;
}

export interface SummaryCorpusFreshness {
  readonly count: number;
  /**
   * The newest thing written to this Member in the period, or `null` when nothing was. Its id
   * is what a refresh is keyed by, so a page opened twice over unchanged Feedback asks for one
   * regeneration rather than two.
   */
  readonly newest: { readonly id: string; readonly createdAt: Date } | null;
}
