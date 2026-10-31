'use client';

import { useCallback } from 'react';
import { useEndlessList } from '@/app/(signed-in)/(brand-new)/_lib/use-endless-list';
import type { WaitingAsksPage } from '@/app/(signed-in)/(brand-new)/brand-new-waiting/_lib/waiting-asks.service';
import { readNextWaitingAsks } from '@/app/(signed-in)/(brand-new)/brand-new-waiting/_lib/waiting-asks-actions.service';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { FeedPageFailed } from '@/components/organisms/feed-card/feed-page-failed';
import { WaitingAskCard } from '@/components/organisms/feed-card/waiting-ask-card';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { type BrandNewWaitingSort, ROUTES } from '@/lib/routes.constant';
import { useAnsweredAsks } from './answered-asks';
import { WaitingEmpty } from './waiting-empty';

export type WaitingAskListProps = {
  /** The page the server read. Later reads of it are ignored: see `useEndlessList`. */
  initialPage: WaitingAsksPage;
  /** The order it reads in. The page keys this by it, so changing it starts again. */
  sort: BrandNewWaitingSort;
};

/**
 * The cards waiting for the person, reading the next page as the end of the list comes near. An
 * answered card leaves where it stands, so the person keeps their place.
 */
export function WaitingAskList({ initialPage, sort }: WaitingAskListProps) {
  const readNext = useCallback(
    (cursor: string) => readNextWaitingAsks({ sort, cursor }),
    [sort],
  );
  const { items, phase, hasMore, endRef, readNextPage } = useEndlessList<MyAsk>(
    initialPage,
    readNext,
  );
  const { answered } = useAnsweredAsks();
  const waiting = items.filter((ask) => !answered.has(ask.askId));

  if (waiting.length === 0 && !hasMore) {
    return <WaitingEmpty />;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-col gap-1.5">
        {waiting.map((ask) => (
          <li key={ask.askId}>
            <WaitingAskCard
              ask={ask}
              target={{ href: ROUTES.brandNewWaitingAsk(ask.askId, sort) }}
            />
          </li>
        ))}
      </ul>
      {phase === 'reading' && <FeedCardSkeleton />}
      {phase === 'failed' && <FeedPageFailed onRetry={readNextPage} />}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
