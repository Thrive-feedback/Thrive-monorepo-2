'use client';

import { memo } from 'react';
import { FeedCard } from '@/components/organisms/feed-card/feed-card';
import { KudosFeedCard } from '@/components/organisms/feed-card/kudos-feed-card';
import type { HomeFeedEntry as Entry } from '@/lib/feedback/home-feed-item.type';
import { type HomeShow, ROUTES } from '@/lib/routes.constant';

export type HomeFeedEntryProps = {
  entry: Entry;
  readerAccountId: string;
  show: HomeShow;
};

/**
 * One card on Home, drawn as every list in the app draws it. Kept from drawing again while the list
 * grows: the list holds each entry it has read as the same object, and the rest are strings, so a
 * page arriving, or a day being found, redraws only the cards it adds.
 */
export const HomeFeedEntry = memo(function HomeFeedEntry({
  entry,
  readerAccountId,
  show,
}: HomeFeedEntryProps) {
  return entry.kind === 'KUDOS' ? (
    <KudosFeedCard kudos={entry} readerAccountId={readerAccountId} />
  ) : (
    <FeedCard
      item={entry}
      readerAccountId={readerAccountId}
      target={{ href: ROUTES.homeFeedback(entry.id, show) }}
    />
  );
});
