'use client';

import { cva } from 'class-variance-authority';
import { useCallback } from 'react';
import type {
  PersonalItem,
  PersonalItemsPage,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-item.type';
import { PERSONAL_ITEMS_GRID } from '@/app/(signed-in)/(brand-new)/_lib/personal-items-layout.constant';
import {
  PERSONAL_ITEMS_ROUTES,
  type PersonalItemsSide,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-items-side.constant';
import { useEndlessList } from '@/app/(signed-in)/(brand-new)/_lib/use-endless-list';
import { usePersonalItemsView } from '@/app/(signed-in)/(brand-new)/_lib/use-personal-items-view';
import { FeedCard } from '@/components/organisms/feed-card/feed-card';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { KudosFeedCard } from '@/components/organisms/feed-card/kudos-feed-card';
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
  /** Which list this is. */
  side: PersonalItemsSide;
  /** The server action that reads the next page. `null` means it could not be read. */
  readNext: (input: unknown) => Promise<PersonalItemsPage | null>;
};

type PersonalCardProps = {
  item: PersonalItem;
  side: PersonalItemsSide;
  readerAccountId: string;
};

/** One thing in the list, as the same thing reads on Home. */
function PersonalCard({ item, side, readerAccountId }: PersonalCardProps) {
  return item.kind === 'KUDOS' ? (
    <KudosFeedCard kudos={item} readerAccountId={readerAccountId} />
  ) : (
    <FeedCard
      item={item}
      readerAccountId={readerAccountId}
      target={{ href: PERSONAL_ITEMS_ROUTES[side].feedback(item.id, 'list') }}
    />
  );
}

/**
 * A Member's own list, as a grid of cards or as Home's list of them, reading the next page as the
 * end comes near. Both views draw the same items from here, so changing the view keeps what has been
 * read.
 */
export function PersonalItemList({
  initialPage,
  side,
  readNext,
}: PersonalItemListProps) {
  const view = usePersonalItemsView();
  const readNextPageAfter = useCallback(
    (cursor: string) => readNext({ cursor }),
    [readNext],
  );
  const {
    items: read,
    phase,
    endRef,
    readNextPage,
  } = useEndlessList<PersonalItem>(initialPage, readNextPageAfter);

  return (
    <div className={column({ view })}>
      <ul className={items({ view })}>
        {read.map((item) => (
          <li key={item.id} className="min-w-0">
            {view === 'grid' ? (
              <PersonalItemTile
                item={item}
                side={side}
                readerAccountId={initialPage.readerAccountId}
              />
            ) : (
              <PersonalCard
                item={item}
                side={side}
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
