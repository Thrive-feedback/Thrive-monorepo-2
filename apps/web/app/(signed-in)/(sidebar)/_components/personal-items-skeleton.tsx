import {
  PERSONAL_ITEM_TILE,
  PERSONAL_ITEMS_GRID,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-items-layout.constant';
import { Skeleton, SkeletonRegion } from '@/components/atoms/skeleton';
import { FeedCardSkeletonList } from '@/components/organisms/feed-card/feed-card-skeleton';
import type { BrandNewPersonalView } from '@/lib/routes.constant';

/** A box still loading, part for part, as tall as the one it stands for. */
function PersonalItemTileSkeleton() {
  return (
    <div className={PERSONAL_ITEM_TILE}>
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
export function PersonalItemsGridSkeleton() {
  return (
    <div className={PERSONAL_ITEMS_GRID}>
      <PersonalItemTileSkeleton />
      <PersonalItemTileSkeleton />
      <div className="hidden lg:block">
        <PersonalItemTileSkeleton />
      </div>
    </div>
  );
}

export type PersonalItemsSkeletonProps = {
  view: BrandNewPersonalView;
};

/** A Member's own list, still loading, in the view it will be drawn in. */
export function PersonalItemsSkeleton({ view }: PersonalItemsSkeletonProps) {
  return view === 'grid' ? (
    <div className="flex flex-col gap-3">
      <PersonalItemsGridSkeleton />
      <PersonalItemsGridSkeleton />
    </div>
  ) : (
    <FeedCardSkeletonList />
  );
}

export type PersonalItemsLoadingProps = {
  view: BrandNewPersonalView;
};

/** The list still loading, in the view it will be drawn in, announced as it is. */
export function PersonalItemsLoading({ view }: PersonalItemsLoadingProps) {
  return (
    <SkeletonRegion>
      <PersonalItemsSkeleton view={view} />
    </SkeletonRegion>
  );
}
