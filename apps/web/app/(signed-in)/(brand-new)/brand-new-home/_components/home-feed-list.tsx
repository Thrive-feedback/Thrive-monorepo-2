'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { readNextHomeFeedPage } from '@/app/(signed-in)/(brand-new)/brand-new-home/_lib/home-feed-actions.service';
import { FeedCardList } from '@/components/organisms/feed-card/feed-card-list';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { FeedPageFailed } from '@/components/organisms/feed-card/feed-page-failed';
import type { HomeFeedPage } from '@/lib/feedback/home-feed-item.type';
import { type BrandNewHomeShow, ROUTES } from '@/lib/routes.constant';

/** Starts reading the next page this far before the end comes into view. */
const READ_AHEAD = '400px';

export type HomeFeedListProps = {
  /** The page the server read. Later reads of it are ignored: see below. */
  initialPage: HomeFeedPage;
  show: BrandNewHomeShow;
};

/**
 * Home's cards, reading the next page as the end of the list comes near. What has been read is
 * held here rather than taken from `initialPage` on every render, because opening a card changes
 * the address and reads the first page again, and that must not move cards under the person. The
 * page keys this by filter, so changing the filter starts again.
 */
export function HomeFeedList({ initialPage, show }: HomeFeedListProps) {
  const [items, setItems] = useState(initialPage.items);
  const [cursor, setCursor] = useState(initialPage.nextCursor);
  const [phase, setPhase] = useState<'idle' | 'reading' | 'failed'>('idle');
  const endRef = useRef<HTMLDivElement>(null);

  const readNextPage = useCallback(async () => {
    if (cursor === null) {
      return;
    }
    setPhase('reading');
    const page = await readNextHomeFeedPage({ show, cursor });
    if (!page) {
      setPhase('failed');
      return;
    }
    setItems((read) => [...read, ...page.items]);
    setCursor(page.nextCursor);
    setPhase('idle');
  }, [cursor, show]);

  useEffect(() => {
    const end = endRef.current;
    if (!end || cursor === null || phase !== 'idle') {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void readNextPage();
        }
      },
      { rootMargin: READ_AHEAD },
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [cursor, phase, readNextPage]);

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
