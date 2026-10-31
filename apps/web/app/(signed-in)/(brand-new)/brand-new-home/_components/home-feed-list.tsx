'use client';

import { useCallback } from 'react';
import { useEndlessList } from '@/app/(signed-in)/(brand-new)/_lib/use-endless-list';
import { readNextHomeFeedPage } from '@/app/(signed-in)/(brand-new)/brand-new-home/_lib/home-feed-actions.service';
import { FeedCardList } from '@/components/organisms/feed-card/feed-card-list';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { FeedPageFailed } from '@/components/organisms/feed-card/feed-page-failed';
import type { HomeFeedPage } from '@/lib/feedback/home-feed-item.type';
import { type BrandNewHomeShow, ROUTES } from '@/lib/routes.constant';

export type HomeFeedListProps = {
  /** The page the server read. Later reads of it are ignored: see `useEndlessList`. */
  initialPage: HomeFeedPage;
  show: BrandNewHomeShow;
};

/**
 * Home's cards, reading the next page as the end of the list comes near. The page keys this by
 * filter, so changing the filter starts again.
 */
export function HomeFeedList({ initialPage, show }: HomeFeedListProps) {
  const readNext = useCallback(
    (cursor: string) => readNextHomeFeedPage({ show, cursor }),
    [show],
  );
  const { items, phase, endRef, readNextPage } = useEndlessList(
    initialPage,
    readNext,
  );

  return (
    <div className="flex flex-col gap-1.5">
      <FeedCardList
        items={items}
        readerAccountId={initialPage.readerAccountId}
        targetFor={(item) => ({
          href: ROUTES.brandNewHomeFeedback(item.id, show),
        })}
      />
      {phase === 'reading' && <FeedCardSkeleton />}
      {phase === 'failed' && <FeedPageFailed onRetry={readNextPage} />}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
