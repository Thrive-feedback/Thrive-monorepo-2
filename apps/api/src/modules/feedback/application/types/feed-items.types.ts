import type { DayCount } from '../../domain/value-object/calendar-day.vo';
import type { FeedItemView } from './feedback-request.types';
import type { KudosView } from './kudos.types';

/** A Kudos among what one Member reads on Home. */
export interface KudosFeedItemView extends KudosView {
  readonly kind: 'KUDOS';
}

/** One page of what one Member reads on Home. */
export interface FeedItemsView {
  /** Feedback and Kudos together, newest first. */
  readonly items: readonly (FeedItemView | KudosFeedItemView)[];
  /** The id the next page starts after, or `null` on the last page. */
  readonly nextAfterId: string | null;
}

/** How much of each kind one Member's Home held in total over some days. */
export interface FeedItemTotalsView {
  readonly offeredFeedback: number;
  readonly requestedFeedback: number;
  readonly kudos: number;
}

/** What one Member's Home held on each of the last few days, oldest first, and in all. */
export interface FeedItemDaysView {
  readonly days: readonly DayCount[];
  readonly totals: FeedItemTotalsView;
}
