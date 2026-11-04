import type { components } from '@repo/api';
import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';
import type { PostcardAsk } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { ReadPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import type { AskStatus } from '@/lib/feedback/ask-status.constant';
import type {
  HomeFeedItem,
  HomeFeedPerson,
} from '@/lib/feedback/home-feed-item.type';
import type { TextTags } from '@/lib/feedback/text-tags.type';

export type PersonalItemOnTheWire =
  components['schemas']['ListReceivedItemsResponseDto_Output']['items'][number];

/** A piece of Feedback in Received or Given: what a card on Home shows, and the postcard it is on. */
export type PersonalFeedback = HomeFeedItem & {
  readonly kind: 'FEEDBACK';
  readonly card: ReadPostcard;
};

/** A Kudos in Received or Given, on the card it was written on. */
export type PersonalKudos = ReadKudos & { readonly kind: 'KUDOS' };

export type PersonalItem = PersonalFeedback | PersonalKudos;

/** A request nobody has answered yet, as its card: the Ask on the left, nothing on the right. */
export type AskedPostcard = {
  readonly kind: 'asked';
  readonly ask: PostcardAsk;
  readonly messageTags: TextTags;
  /** When it was sent, as an ISO date. */
  readonly sentOn: string;
};

/** What one person a Member asked sent back. */
export type PersonalRequestAnswer = {
  /** The Feedback it is, which opens its postcard. */
  readonly id: string;
  readonly message: string;
  readonly messageTags: TextTags;
  readonly answeredAt: string;
  /** The postcard they sent back: the request on the left, this answer on the right. */
  readonly card: ReadPostcard;
};

/** One person a Member's request asked, where they stand, and what they sent back. */
export type PersonalRequestAsk = {
  readonly person: HomeFeedPerson;
  readonly status: AskStatus;
  /** `null` while Pending. */
  readonly answer: PersonalRequestAnswer | null;
};

/** A request the Member sent, in their Received: the question, everyone asked, every answer. */
export type PersonalRequest = {
  readonly kind: 'REQUEST';
  readonly id: string;
  /** The Request message. */
  readonly message: string;
  readonly messageTags: TextTags;
  readonly visibility: PersonalRequestOnTheWire['visibility'];
  readonly sentAt: string;
  /** The request on its own card, before anybody answered it. */
  readonly card: AskedPostcard;
  /** In the order they were asked. */
  readonly asked: readonly PersonalRequestAsk[];
};

export type PersonalRequestOnTheWire = Extract<
  PersonalItemOnTheWire,
  { kind: 'REQUEST' }
>;

/** One thing in a Member's own list as drawn. Only Received holds requests. */
export type PersonalListItem = PersonalItem | PersonalRequest;

/** One page of a Member's own list, and where the next one starts. */
export type PersonalItemsPage = {
  /** Who is reading, so a card on the list can say "You". */
  readonly readerAccountId: string;
  readonly items: readonly PersonalListItem[];
  /** `null` on the last page. */
  readonly nextCursor: string | null;
};
