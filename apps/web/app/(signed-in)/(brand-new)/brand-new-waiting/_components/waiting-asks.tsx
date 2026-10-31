import { readWaitingAsks } from '@/app/(signed-in)/(brand-new)/brand-new-waiting/_lib/waiting-asks.service';
import { SkeletonRegion } from '@/components/atoms/skeleton';
import { FeedCardListSkeleton } from '@/components/organisms/feed-card/feed-card-list';
import type { BrandNewWaitingSort } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { WaitingAskList } from './waiting-ask-list';
import { WaitingEmpty } from './waiting-empty';

export type WaitingAsksProps = {
  membership: CurrentMembership;
  sort: BrandNewWaitingSort;
};

/** The first page of Waiting for me, read here so the page renders around it. */
export async function WaitingAsks({ membership, sort }: WaitingAsksProps) {
  const page = await readWaitingAsks(membership, sort);

  if (page.items.length === 0) {
    return <WaitingEmpty />;
  }
  return <WaitingAskList key={sort} initialPage={page} sort={sort} />;
}

/** `WaitingAsks` still loading: a few cards, spaced as the list spaces them. */
export function WaitingAsksSkeleton() {
  return (
    <SkeletonRegion>
      <FeedCardListSkeleton />
    </SkeletonRegion>
  );
}
