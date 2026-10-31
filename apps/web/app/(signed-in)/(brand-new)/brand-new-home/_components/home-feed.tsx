import { readHomeFeed } from '@/app/(signed-in)/(brand-new)/brand-new-home/_lib/home-feed.service';
import { SkeletonRegion } from '@/components/atoms/skeleton';
import { FeedCardListSkeleton } from '@/components/organisms/feed-card/feed-card-list';
import { FeedEmpty } from '@/components/organisms/feed-card/feed-empty';
import type { BrandNewHomeShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { HomeFeedList } from './home-feed-list';

export type HomeFeedProps = {
  membership: CurrentMembership;
  show: BrandNewHomeShow;
};

/** The first page of Home, read here so the page renders around it while it is in flight. */
export async function HomeFeed({ membership, show }: HomeFeedProps) {
  const page = await readHomeFeed(membership, show);

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
      show={show}
    />
  );
}

/** `HomeFeed` still loading: a few cards, spaced as the list spaces them. */
export function HomeFeedSkeleton() {
  return (
    <SkeletonRegion>
      <FeedCardListSkeleton />
    </SkeletonRegion>
  );
}
