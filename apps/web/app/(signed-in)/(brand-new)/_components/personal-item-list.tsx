'use client';

import { cva } from 'class-variance-authority';
import { useCallback } from 'react';
import { useEndlessList } from '@/app/(signed-in)/(brand-new)/_lib/use-endless-list';
import type {
  ReceivedItem,
  ReceivedPage,
} from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-item.type';
import { readNextReceivedPage } from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-items-actions.service';
import { RECEIVED_GRID } from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-layout.constant';
import { useReceivedView } from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/use-received-view';
import { FeedCard } from '@/components/organisms/feed-card/feed-card';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { KudosFeedCard } from '@/components/organisms/feed-card/kudos-feed-card';
import { ROUTES } from '@/lib/routes.constant';
import { ReceivedPageFailed } from './received-page-failed';
import { ReceivedGridSkeleton } from './received-skeleton';
import { ReceivedTile } from './received-tile';

const column = cva('flex flex-col', {
  variants: { view: { grid: 'gap-3', list: 'gap-1.5' } },
});

const items = cva('', {
  variants: { view: { grid: RECEIVED_GRID, list: column({ view: 'list' }) } },
});

export type ReceivedListProps = {
  /** The page the server read. Later reads of it are ignored: see `useEndlessList`. */
  initialPage: ReceivedPage;
};

type ReceivedCardProps = {
  item: ReceivedItem;
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
export function ReceivedList({ initialPage }: ReceivedListProps) {
  const view = useReceivedView();
  const readNext = useCallback(
    (cursor: string) => readNextReceivedPage({ cursor }),
    [],
  );
  const {
    items: received,
    phase,
    endRef,
    readNextPage,
  } = useEndlessList<ReceivedItem>(initialPage, readNext);

  return (
    <div className={column({ view })}>
      <ul className={items({ view })}>
        {received.map((item) => (
          <li key={item.id} className="min-w-0">
            {view === 'grid' ? (
              <ReceivedTile item={item} />
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
        (view === 'grid' ? <ReceivedGridSkeleton /> : <FeedCardSkeleton />)}
      {phase === 'failed' && <ReceivedPageFailed onRetry={readNextPage} />}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
