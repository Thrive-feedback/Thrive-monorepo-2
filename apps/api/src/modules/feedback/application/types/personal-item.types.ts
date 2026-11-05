import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
import type {
  AnswerPostcardSnapshot,
  PostcardSnapshot,
} from '../../domain/value-object/postcard.vo';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';
import type { KudosFeedItemView } from './feed-items.types';
import type {
  FeedItemView,
  PersonView,
  TagsView,
} from './feedback-request.types';
import type { FeedPosition } from './kudos.types';

/**
 * A piece of Feedback in a Member's own list: all a card on Home shows, the card it was written on
 * among it, at any Visibility, because a Receiver owns what was written to them and a Giver what
 * they wrote.
 */
export interface PersonalFeedbackView extends Omit<FeedItemView, 'visibility'> {
  readonly visibility: VisibilityValue;
}

export type PersonalItemView = PersonalFeedbackView | KudosFeedItemView;

/** What one Ask of a Member's own request sent back, on the postcard its Giver answered on. */
export interface SentRequestAnswerView {
  /** The Feedback it is, which is what opens its postcard. */
  readonly id: string;
  readonly message: string;
  readonly tags: TagsView;
  /** How its words look, or `null` when it was not written on the postcard. */
  readonly postcard: AnswerPostcardSnapshot | null;
  readonly answeredAt: Date;
}

/** One person a Member's own request asked, where they stand, and what they sent back. */
export interface SentRequestAskView {
  readonly person: PersonView;
  readonly status: AskStatusValue;
  /** `null` while Pending. The Requester reads every answer to what they asked. */
  readonly answer: SentRequestAnswerView | null;
}

/**
 * A Feedback Request in its Requester's Received: the question, everyone asked and every answer
 * (brain `ADR-0053`). It sits at its latest activity, so a new answer moves it up.
 */
export interface SentRequestItemView {
  readonly kind: 'REQUEST';
  readonly id: string;
  /** The Request message. */
  readonly message: string;
  readonly tags: TagsView;
  readonly visibility: VisibilityValue;
  /** The Member who sent it, whose Received this is: the card is signed by them. */
  readonly requester: PersonView;
  /** Who it was shared with under Selected people, and nobody otherwise. */
  readonly selectedPeople: readonly PersonView[];
  /** How the card looks, or `null` when it was not written on a postcard. */
  readonly postcard: PostcardSnapshot | null;
  /** When it was sent. */
  readonly createdAt: Date;
  /** Its newest answer, or when it was sent while nobody has answered: where it sits in the list. */
  readonly latestActivityAt: Date;
  /** In the order they were asked. */
  readonly asked: readonly SentRequestAskView[];
}

/** One thing in a Member's Received: what Given holds too, and the requests they sent. */
export type ReceivedItemView = PersonalItemView | SentRequestItemView;

/** Which kind of thing Received is narrowed to: everything unless it says otherwise. */
export const RECEIVED_ITEM_SHOWS = [
  'ALL',
  'REQUESTS',
  'OFFERED',
  'KUDOS',
] as const;

export type ReceivedItemShow = (typeof RECEIVED_ITEM_SHOWS)[number];

/** Where an item sits in a Member's own list: when it was written, or a request's latest activity. */
export function positionOf(item: ReceivedItemView): FeedPosition {
  return {
    createdAt: item.kind === 'REQUEST' ? item.latestActivityAt : item.createdAt,
    id: item.id,
  };
}

/** One page of a Member's own list, newest first across every kind it reads, by position. */
export interface PersonalItemsPage<Item extends ReceivedItemView> {
  readonly items: readonly Item[];
  /** Where the last item sat when it was read, which the next page starts after; `null` at the end. */
  readonly next: FeedPosition | null;
}

/** One page of a Member's own list, newest first across both kinds. */
export interface PersonalItemsView {
  readonly items: readonly PersonalItemView[];
  /** The id the next page starts after, or `null` on the last page. */
  readonly nextAfterId: string | null;
}
