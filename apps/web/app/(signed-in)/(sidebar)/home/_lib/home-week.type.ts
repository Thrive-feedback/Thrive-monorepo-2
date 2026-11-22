/** How much of each kind a day, or the week, held on the reader's Home. */
export type HomeWeekCounts = {
  /** Feedback given without being asked. */
  readonly offered: number;
  /** Feedback written to answer an Ask. */
  readonly answers: number;
  readonly kudos: number;
};

/** One of the seven days, `YYYY-MM-DD` on the API's clock (ADR 0095). */
export type HomeWeekDay = HomeWeekCounts & { readonly day: string };

/**
 * The last seven days of the reader's Home as the API counted them, under the filter it shows.
 * Everything Home says about a day, Today and Yesterday included, is worked out from these dates and
 * never from the browser's clock, so the server and the browser draw the same page.
 */
export type HomeWeekSummary = {
  /** The last of the days: today, on the API's clock. */
  readonly today: string;
  /** Oldest first, every one of the seven, the quiet ones too. */
  readonly days: readonly HomeWeekDay[];
  readonly totals: HomeWeekCounts;
  /** Shared with me holds no Kudos, so nothing should say how many it holds. */
  readonly countsKudos: boolean;
};
