import type { components } from '@repo/api';
import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';
import type { ReadPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import type { HomeFeedItem } from '@/lib/feedback/home-feed-item.type';

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

/** One page of a Member's own list, and where the next one starts. */
export type PersonalItemsPage = {
  /** Who is reading, so a card on the list can say "You". */
  readonly readerAccountId: string;
  readonly items: readonly PersonalItem[];
  /** `null` on the last page. */
  readonly nextCursor: string | null;
};
