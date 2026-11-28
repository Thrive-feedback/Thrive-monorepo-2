'use client';

import { useCallback } from 'react';
import { PersonalItemsPageFailed } from '@/app/(signed-in)/(sidebar)/_components/personal-items-page-failed';
import { useEndlessList } from '@/app/(signed-in)/(sidebar)/_lib/use-endless-list';
import type {
  ProfileItemsPage,
  ProfileListItem,
} from '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/profile-item.type';
import { readNextProfilePage } from '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/profile-items-actions.service';
import { FeedCard } from '@/components/organisms/feed-card/feed-card';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { KudosFeedCard } from '@/components/organisms/feed-card/kudos-feed-card';
import { type ProfileShow, ROUTES } from '@/lib/routes.constant';
import { OpenAskCard } from './open-ask-card';

export type ProfileItemListProps = {
  /** The page the server read. Later reads of it are ignored: see `useEndlessList`. */
  initialPage: ProfileItemsPage;
  /** Whose Profile it is, as its address names them. */
  slug: string;
  /** Whose Profile it is, as the API names them. */
  accountId: string;
  /** Which of the Profile's lists this is. */
  show: ProfileShow;
};

function idOf(item: ProfileListItem) {
  return item.id;
}

/**
 * One of a Profile's lists, drawn as Home draws the same cards, reading the next page as the end
 * comes near. Pressing a postcard opens it over the Profile, which keeps showing this list.
 */
export function ProfileItemList({
  initialPage,
  slug,
  accountId,
  show,
}: ProfileItemListProps) {
  const readNextPageAfter = useCallback(
    (cursor: string) => readNextProfilePage({ cursor, accountId, show }),
    [accountId, show],
  );
  const {
    items: read,
    phase,
    endRef,
    readNextPage,
  } = useEndlessList<ProfileListItem>(initialPage, readNextPageAfter, idOf);
  const { readerAccountId } = initialPage;

  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-col gap-1.5">
        {read.map((item) => (
          <li key={item.id} className="min-w-0">
            {item.kind === 'KUDOS' ? (
              <KudosFeedCard kudos={item} readerAccountId={readerAccountId} />
            ) : item.kind === 'ASK' ? (
              <OpenAskCard ask={item} readerAccountId={readerAccountId} />
            ) : (
              <FeedCard
                item={item}
                readerAccountId={readerAccountId}
                target={{
                  href: ROUTES.profileFeedback(slug, item.id, show),
                }}
              />
            )}
          </li>
        ))}
      </ul>
      {phase === 'reading' && <FeedCardSkeleton />}
      {phase === 'failed' && <PersonalItemsPageFailed onRetry={readNextPage} />}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
