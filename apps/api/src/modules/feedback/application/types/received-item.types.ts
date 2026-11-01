import type {
  AnswerPostcardSnapshot,
  PostcardSnapshot,
} from '../../domain/value-object/postcard.vo';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';
import type { KudosFeedItemView } from './feed-items.types';
import type {
  FeedItemRequestView,
  FeedItemView,
} from './feedback-request.types';

/** The request an answer was written on: Home's view of it, and the rest of the card it sits on. */
export interface ReceivedRequestView extends FeedItemRequestView {
  /** How the card looks, or `null` when the request was not written on a postcard. */
  readonly postcard: PostcardSnapshot | null;
  /** How the answer's own words look, or `null` when it was not written on the postcard. */
  readonly answerPostcard: AnswerPostcardSnapshot | null;
}

/**
 * A piece of Feedback in what a Member received: all a card on Home shows, with the card it was
 * written on, and at any Visibility, because a Receiver owns what was written to them.
 */
export interface ReceivedFeedbackView
  extends Omit<FeedItemView, 'visibility' | 'request'> {
  readonly visibility: VisibilityValue;
  /** How it looks, or `null` when it was not written on a postcard, or is an answer. */
  readonly postcard: PostcardSnapshot | null;
  /** The card an answer is on, or `null` for Feedback given without being asked. */
  readonly request: ReceivedRequestView | null;
}

export type ReceivedItemView = ReceivedFeedbackView | KudosFeedItemView;

/** One page of what a Member received, newest first across both kinds. */
export interface ReceivedItemsView {
  readonly items: readonly ReceivedItemView[];
  /** The id the next page starts after, or `null` on the last page. */
  readonly nextAfterId: string | null;
}
