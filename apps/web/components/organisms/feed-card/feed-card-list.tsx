import type { HomeFeedItem } from '@/lib/feedback/home-feed-item.type';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { FeedCard } from './feed-card';
import { FeedCardSkeleton } from './feed-card-skeleton';

/** Enough cards to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

export type FeedCardListProps = {
  /** The pieces, newest first, of either kind. */
  items: readonly HomeFeedItem[];
  /** Who is reading, so each card can say "You" where it names them. */
  readerAccountId: string;
  /** What pressing a piece's small postcard does. */
  targetFor: (item: HomeFeedItem) => NavTarget;
};

/** Home's feed: one card for each piece, the card chosen by how the piece came about. */
export function FeedCardList({
  items,
  readerAccountId,
  targetFor,
}: FeedCardListProps) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item.id}>
          <FeedCard
            item={item}
            readerAccountId={readerAccountId}
            target={targetFor(item)}
          />
        </li>
      ))}
    </ul>
  );
}

/** A `FeedCardList` still loading: a few cards, spaced as the list spaces them. */
export function FeedCardListSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {PLACEHOLDERS.map((placeholder) => (
        <FeedCardSkeleton key={placeholder} />
      ))}
    </div>
  );
}
