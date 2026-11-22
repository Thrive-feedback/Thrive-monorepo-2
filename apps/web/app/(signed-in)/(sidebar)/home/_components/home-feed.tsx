import { readHomeFeed } from '@/app/(signed-in)/(sidebar)/home/_lib/home-feed.service';
import { SkeletonRegion } from '@/components/atoms/skeleton';
import { FeedCardSkeletonList } from '@/components/organisms/feed-card/feed-card-skeleton';
import type { HomeShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { readHomeWeek } from '../_lib/home-week.service';
import { FeedEmpty } from './feed-empty';
import { HomeFeedList } from './home-feed-list';

export type HomeFeedProps = {
  membership: CurrentMembership;
  show: HomeShow;
};

/**
 * The first page of Home, read here so the page renders around it while it is in flight, with the
 * week it is grouped by: one read the header makes too, so `readHomeWeek` makes it once, and both
 * start together.
 */
export async function HomeFeed({ membership, show }: HomeFeedProps) {
  const [page, week] = await Promise.all([
    readHomeFeed(membership, show),
    readHomeWeek(membership, show),
  ]);

  if (page.items.length === 0) {
    return <FeedEmpty show={show} />;
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
      <div className="pt-4 md:grid md:grid-cols-[7rem_minmax(0,1fr)] md:gap-7 md:pt-12">
        <div aria-hidden="true" />
        <FeedCardSkeletonList />
      </div>
    </SkeletonRegion>
  );
}
