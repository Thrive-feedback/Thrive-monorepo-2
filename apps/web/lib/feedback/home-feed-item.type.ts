import type { components, operations } from '@repo/api';
import type { AskStatus } from './ask-status.constant';
import type { FeedbackPerson } from './feedback-person.util';
import type { TextTags } from './text-tags.type';

type FeedItemOnTheWire =
  components['schemas']['ListFeedItemsResponseDto_Output']['items'][number];

/** Which of what a Member reads on Home: the three choices of its filter, as the API names them. */
export type HomeFeedShow = NonNullable<
  NonNullable<
    operations['FeedItemsController_listFeedItems']['parameters']['query']
  >['show']
>;

/** Somebody a card on Home names, with what tells the reader they are looking at themselves. */
export type HomeFeedPerson = FeedbackPerson & {
  readonly accountId: string;
};

/** One person a request asked, where their Ask stands, and what they wrote once they have. */
export type HomeFeedAsk = {
  readonly person: HomeFeedPerson;
  readonly status: AskStatus;
  /** Their answer, or `null` while the Ask is waiting. */
  readonly answer: {
    readonly message: string;
    readonly messageTags: TextTags;
  } | null;
};

/** The request an answer on Home responds to. */
export type HomeFeedRequest = {
  /** The Request message, as the Requester wrote it. */
  readonly message: string;
  /** What the Request message was bound to. */
  readonly messageTags: TextTags;
  readonly requester: HomeFeedPerson;
  /** Everyone asked, in the order they were asked, the Giver of this answer among them. */
  readonly asked: readonly HomeFeedAsk[];
};

/** One piece of Feedback as a card on Home shows it. */
export type HomeFeedItem = {
  readonly id: string;
  /** Requested answers an Ask; Offered was given without being asked. */
  readonly origin: FeedItemOnTheWire['origin'];
  readonly giver: HomeFeedPerson;
  /** Everyone it is for, in the order the Giver chose them — one or more. */
  readonly receivers: readonly HomeFeedPerson[];
  /** The Feedback message, as its Giver wrote it. */
  readonly message: string;
  /** What the Feedback message was bound to. */
  readonly messageTags: TextTags;
  readonly givenAt: string;
  /** Who can read it: Only me is never on Home. */
  readonly visibility: FeedItemOnTheWire['visibility'];
  /** The request an answer responds to; `null` for Offered Feedback. */
  readonly request: HomeFeedRequest | null;
};

/** One page of Home. The reader comes with it because no other read says who they are. */
export type HomeFeedPage = {
  readonly readerAccountId: string;
  readonly items: readonly HomeFeedItem[];
  /** Where the next page starts, or `null` on the last page. */
  readonly nextCursor: string | null;
};
