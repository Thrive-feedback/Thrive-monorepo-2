import type { components } from '@repo/api';

export type FeedbackSummaryOnTheWire = NonNullable<
  components['schemas']['FeedbackSummaryResponseDto_Output']['summary']
>;

/** One message a point was read from, and which kind it is, so it can be opened where it lives. */
export type SummarySource =
  FeedbackSummaryOnTheWire['themes'][number]['sources'][number];

/** One thing the summary says, with the messages behind it. */
export type SummaryPoint = {
  readonly point: string;
  readonly sources: readonly SummarySource[];
};

/** Which part of the summary a block holds. The order is the order it is read in. */
export type SummarySectionName =
  | 'themes'
  | 'strengths'
  | 'areas_to_improve'
  | 'suggested_actions';

/** One block of the summary, as the page draws it. */
export type SummarySection = {
  readonly name: SummarySectionName;
  /** What the block is called, in the words a Member reads. */
  readonly title: string;
  readonly points: readonly SummaryPoint[];
};

/** What the Feedback written to one Member over one period adds up to, as the page reads it. */
export type FeedbackSummary = {
  /** The quarter it covers, `2026-Q4`. */
  readonly period: string;
  readonly generatedAt: string;
  /** Whether Feedback has arrived since it was written. A newer one is already on its way. */
  readonly isStale: boolean;
  readonly sourceCount: number;
  /** Every block, in reading order, whether or not it holds anything. */
  readonly sections: readonly SummarySection[];
};
