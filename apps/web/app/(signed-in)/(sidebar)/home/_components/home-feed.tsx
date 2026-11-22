import { readHomeFeed } from '@/app/(signed-in)/(sidebar)/home/_lib/home-feed.service';
import {
  HOME_DAY_CARDS,
  HOME_DAY_MARGIN,
  HOME_DAY_ROW,
} from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import { readHomeWeekIfCounted } from '@/app/(signed-in)/(sidebar)/home/_lib/home-week.service';
import { SkeletonRegion } from '@/components/atoms/skeleton';
import { FeedCardSkeletonList } from '@/components/organisms/feed-card/feed-card-skeleton';
import { cn } from '@/lib/cn.util';
import type { HomeShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { FeedEmpty } from './feed-empty';
import { NoDayList } from './home-day-jump';
import { HomeFeedList } from './home-feed-list';

export type HomeFeedProps = {
  membership: CurrentMembership;
  show: HomeShow;
};

/**
 * The first page of Home, read here so the page renders around it while it is in flight, with the
 * week it is grouped by: one read the header makes too, through the same cached `readHomeWeek`
 * under `readHomeWeekIfCounted`, so it is made once, and both start together. A week the API could not count leaves the list in days without counts, rather
 * than taking the cards down with it.
 */
export async function HomeFeed({ membership, show }: HomeFeedProps) {
  const [page, week] = await Promise.all([
    readHomeFeed(membership, show),
    readHomeWeekIfCounted(membership, show),
  ]);

  if (page.items.length === 0) {
    return (
      <>
        <NoDayList />
        <FeedEmpty show={show} />
      </>
    );
  }
  // The list keeps what it read, so only the reader's own newest card starts it again: what they
  // just sent has to show, and somebody else's post must not move cards under them.
  const newestOfTheirs = page.items.find(
    (item) => item.giver.accountId === page.readerAccountId,
  )?.id;
  return (
    <HomeFeedList
      key={`${show}:${newestOfTheirs}`}
      initialPage={page}
      week={week}
      show={show}
    />
  );
}

/** `HomeFeed` still loading: a few cards beside the margin the days will stand in. */
export function HomeFeedSkeleton() {
  return (
    <SkeletonRegion>
      <div className={cn('pt-4 md:pt-12', HOME_DAY_ROW)}>
        <div aria-hidden="true" className={HOME_DAY_MARGIN} />
        <div className={HOME_DAY_CARDS}>
          <FeedCardSkeletonList />
        </div>
      </div>
    </SkeletonRegion>
  );
}
