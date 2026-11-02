'use client';

import { cva } from 'class-variance-authority';
import { useCallback } from 'react';
import type {
  PersonalItem,
  PersonalItemsPage,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-item.type';
import { PERSONAL_ITEMS_GRID } from '@/app/(signed-in)/(brand-new)/_lib/personal-items-layout.constant';
import { useEndlessList } from '@/app/(signed-in)/(brand-new)/_lib/use-endless-list';
import { usePersonalItemsView } from '@/app/(signed-in)/(brand-new)/_lib/use-personal-items-view';
import { FeedCard } from '@/components/organisms/feed-card/feed-card';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { KudosFeedCard } from '@/components/organisms/feed-card/kudos-feed-card';
import { ROUTES } from '@/lib/routes.constant';
import { PersonalItemTile } from './personal-item-tile';
import { PersonalItemsPageFailed } from './personal-items-page-failed';
import { PersonalItemsGridSkeleton } from './personal-items-skeleton';

const column = cva('flex flex-col', {
  variants: { view: { grid: 'gap-3', list: 'gap-1.5' } },
});

const items = cva('', {
  variants: {
    view: { grid: PERSONAL_ITEMS_GRID, list: column({ view: 'list' }) },
  },
});

export type PersonalItemListProps = {
  /** The page the server read. Later reads of it are ignored: see `useEndlessList`. */
  initialPage: PersonalItemsPage;
  /** The server action that reads the next page. `null` means it could not be read. */
  readNext: (input: unknown) => Promise<PersonalItemsPage | null>;
};

type ReceivedCardProps = {
  item: PersonalItem;
  readerAccountId: string;
};

/** One thing in the list, as the same thing reads on Home. */
function ReceivedCard({ item, readerAccountId }: ReceivedCardProps) {
  return item.kind === 'KUDOS' ? (
    <KudosFeedCard kudos={item} readerAccountId={readerAccountId} />
  ) : (
    <FeedCard
      item={item}
      readerAccountId={readerAccountId}
      target={{ href: ROUTES.brandNewReceivedFeedback(item.id, 'list') }}
    />
  );
}

/**
 * What was written to the person, as a grid of cards or as Home's list of them, reading the next
 * page as the end comes near. Both views draw the same items from here, so changing the view keeps
 * what has been read.
 */
export function PersonalItemList({
  initialPage,
  readNext,
}: PersonalItemListProps) {
  const view = usePersonalItemsView();
  const readNextPageAfter = useCallback(
    (cursor: string) => readNext({ cursor }),
    [readNext],
  );
  const {
    items: received,
    phase,
    endRef,
    readNextPage,
  } = useEndlessList<PersonalItem>(initialPage, readNextPageAfter);

  return (
    <div className={column({ view })}>
      <ul className={items({ view })}>
        {received.map((item) => (
          <li key={item.id} className="min-w-0">
            {view === 'grid' ? (
              <PersonalItemTile item={item} />
            ) : (
              <ReceivedCard
                item={item}
                readerAccountId={initialPage.readerAccountId}
              />
            )}
          </li>
        ))}
      </ul>
      {phase === 'reading' &&
        (view === 'grid' ? (
          <PersonalItemsGridSkeleton />
        ) : (
          <FeedCardSkeleton />
        ))}
      {phase === 'failed' && <PersonalItemsPageFailed onRetry={readNextPage} />}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
