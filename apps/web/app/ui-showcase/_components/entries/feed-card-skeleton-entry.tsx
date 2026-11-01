import {
  ShowcaseEntry,
  StateCell,
} from '@/app/ui-showcase/_components/showcase-entry';
import {
  FeedCardSkeleton,
  FeedCardSkeletonList,
} from '@/components/organisms/feed-card/feed-card-skeleton';
import { CardCover } from './card-cover';

export function FeedCardSkeletonEntry() {
  return (
    <ShowcaseEntry
      name="FeedCardSkeleton"
      level="organism"
      origin="thrive"
      source="components/organisms/feed-card/feed-card-skeleton.tsx — Skeleton, on the ground of a feed card"
      summary="A card on Home or Waiting for me still loading, line for line, so the list does not jump when it arrives."
      useFor="FeedCardSkeletonList while a page's first cards load; FeedCardSkeleton under a list while it reads the next page."
      avoidFor="Anything that is not a feed card: use Skeleton."
      usage={`import {
  FeedCardSkeleton,
  FeedCardSkeletonList,
} from '@/components/organisms/feed-card/feed-card-skeleton';

<SkeletonRegion>
  <FeedCardSkeletonList />
</SkeletonRegion>`}
      props={[]}
      accessibility={[
        'Nothing in it is read out. SkeletonRegion around it says the page is loading.',
      ]}
    >
      <StateCell
        label="One card"
        hint="Under a list, reading the next page."
        wide
      >
        <div className="w-full max-w-180">
          <FeedCardSkeleton />
        </div>
      </StateCell>
      <StateCell label="Several" hint="While the first page loads." wide>
        <div className="w-full max-w-180">
          <FeedCardSkeletonList />
        </div>
      </StateCell>
    </ShowcaseEntry>
  );
}

export function FeedCardSkeletonPreview() {
  return (
    <CardCover>
      <FeedCardSkeleton />
    </CardCover>
  );
}
