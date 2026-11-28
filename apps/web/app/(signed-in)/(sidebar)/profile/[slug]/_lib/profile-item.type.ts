import type { components } from '@repo/api';
import type { PersonalItem } from '@/app/(signed-in)/(sidebar)/_lib/personal-item.type';
import type { AskedPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import type { HomeFeedPerson } from '@/lib/feedback/home-feed-item.type';
import type { TextTags } from '@/lib/feedback/text-tags.type';

export type ProfileItemOnTheWire =
  components['schemas']['ListProfileItemsResponseDto_Output']['items'][number];

export type PendingAskOnTheWire = Extract<
  ProfileItemOnTheWire,
  { kind: 'ASK' }
>;

/** An Ask still waiting between the reader and the Member: one asked, the other has not answered. */
export type ProfilePendingAsk = {
  readonly kind: 'ASK';
  /** The Ask's own id. */
  readonly id: string;
  /** The Request message. */
  readonly message: string;
  readonly messageTags: TextTags;
  readonly requester: HomeFeedPerson;
  /** Who was asked and has not answered. */
  readonly asked: HomeFeedPerson;
  readonly askedAt: string;
  /** The card the request was sent on, still blank where the answer goes. */
  readonly card: AskedPostcard;
};

/** One thing on a Profile as drawn. Only what is between the reader and the Member holds Asks. */
export type ProfileListItem = PersonalItem | ProfilePendingAsk;

/** One page of a Profile's list, and where the next one starts. */
export type ProfileItemsPage = {
  /** Who is reading, so a card can say "You", and an Ask can tell which way it goes. */
  readonly readerAccountId: string;
  readonly items: readonly ProfileListItem[];
  /** `null` on the last page. */
  readonly nextCursor: string | null;
};
