'use client';

import { useCallback } from 'react';
import { useEndlessList } from '@/app/(signed-in)/(sidebar)/_lib/use-endless-list';
import { readNextHomeFeedPage } from '@/app/(signed-in)/(sidebar)/home/_lib/home-feed-actions.service';
import { FeedCard } from '@/components/organisms/feed-card/feed-card';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { FeedPageFailed } from '@/components/organisms/feed-card/feed-page-failed';
import { KudosFeedCard } from '@/components/organisms/feed-card/kudos-feed-card';
import type { HomeFeedPage } from '@/lib/feedback/home-feed-item.type';
import { type HomeShow, ROUTES } from '@/lib/routes.constant';

export type HomeFeedListProps = {
  /** The page the server read. Later reads of it are ignored: see `useEndlessList`. */
  initialPage: HomeFeedPage;
  show: HomeShow;
};

function idOf(item: { readonly id: string }) {
  return item.id;
}

/**
 * Home's cards, Feedback and Kudos together, reading the next page as the end of the list comes near. The page keys this by
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
    idOf,
  );

  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            {item.kind === 'KUDOS' ? (
              <KudosFeedCard
                kudos={item}
                readerAccountId={initialPage.readerAccountId}
              />
            ) : (
              <FeedCard
                item={item}
                readerAccountId={initialPage.readerAccountId}
                target={{ href: ROUTES.homeFeedback(item.id, show) }}
              />
            )}
          </li>
        ))}
      </ul>
      {phase === 'reading' && <FeedCardSkeleton />}
      {phase === 'failed' && <FeedPageFailed onRetry={readNextPage} />}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
