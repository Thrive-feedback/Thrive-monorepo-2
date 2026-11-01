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
