import type { FeedbackOrigin } from '../../domain/entity/feedback.entity';
import type { KindCounts } from '../../domain/value-object/calendar-day.vo';
import type { FeedItemView } from './feedback-request.types';
import type { KudosView } from './kudos.types';

/** A Kudos among what one Member reads on Home. */
export interface KudosFeedItemView extends KudosView {
  readonly kind: 'KUDOS';
}

/** The day a piece of Home was given, which is what Home groups its list by (ADR 0095). */
export interface OnHomeDay {
  /** `YYYY-MM-DD`, on the one clock every calendar is read on. */
  readonly day: string;
}

/** One page of what one Member reads on Home. */
export interface FeedItemsView {
  /** Feedback and Kudos together, newest first, each with its day. */
  readonly items: readonly ((FeedItemView | KudosFeedItemView) & OnHomeDay)[];
  /** The id the next page starts after, or `null` on the last page. */
  readonly nextAfterId: string | null;
}

/** When one piece of Feedback on Home was given, and whether it answered an Ask. */
export interface FeedbackGivenAt {
  readonly origin: FeedbackOrigin;
  readonly createdAt: Date;
}

/** How much of each kind one day held on one Member's Home. */
export interface FeedItemDayView extends KindCounts {
  /** `YYYY-MM-DD`, on the one clock every calendar is read on. */
  readonly day: string;
}

/** What one Member's Home held on each of the last few days, oldest first, and in all. */
export interface FeedItemDaysView {
  readonly days: readonly FeedItemDayView[];
  readonly totals: KindCounts;
}
