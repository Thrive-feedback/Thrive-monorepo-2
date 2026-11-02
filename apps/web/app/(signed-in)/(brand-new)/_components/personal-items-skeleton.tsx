import {
  RECEIVED_GRID,
  RECEIVED_TILE,
} from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/received-layout.constant';
import { Skeleton } from '@/components/atoms/skeleton';
import { FeedCardSkeletonList } from '@/components/organisms/feed-card/feed-card-skeleton';
import type { BrandNewReceivedView } from '@/lib/routes.constant';

/** A box still loading, part for part, as tall as the one it stands for. */
function ReceivedTileSkeleton() {
  return (
    <div className={RECEIVED_TILE}>
      <div className="flex items-center gap-2">
        <Skeleton shape="circle" className="size-8 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col">
          <Skeleton className="w-3/4 text-subtitle-4" />
          <Skeleton className="w-1/2 text-body-3" />
        </div>
      </div>
      <div className="p-2">
        <Skeleton shape="card" className="aspect-3/2 h-auto w-full" />
      </div>
      <div className="flex flex-col">
        <Skeleton className="text-body-2" />
        <Skeleton className="w-4/5 text-body-2" />
      </div>
    </div>
  );
}

/** A row of boxes still loading, spaced as the grid spaces them. */
export function ReceivedGridSkeleton() {
  return (
    <div className={RECEIVED_GRID}>
      <ReceivedTileSkeleton />
      <ReceivedTileSkeleton />
      <div className="hidden lg:block">
        <ReceivedTileSkeleton />
      </div>
    </div>
  );
}

export type ReceivedItemsSkeletonProps = {
  view: BrandNewReceivedView;
};

/** What was written to the person, still loading, in the view it will be drawn in. */
export function ReceivedItemsSkeleton({ view }: ReceivedItemsSkeletonProps) {
  return view === 'grid' ? (
    <div className="flex flex-col gap-3">
      <ReceivedGridSkeleton />
      <ReceivedGridSkeleton />
    </div>
  ) : (
    <FeedCardSkeletonList />
  );
}
