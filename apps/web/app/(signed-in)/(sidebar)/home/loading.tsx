import {
  BAND_TOP_SPACE,
  HangingBand,
} from '@/app/(signed-in)/(sidebar)/_components/hanging-band';
import {
  PAGE_COLUMN,
  PAGE_COLUMN_WIDTH,
} from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import {
  HOME_BAND_FOOT,
  HOME_COMPOSER_OVERLAP,
} from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import { Skeleton, SkeletonRegion } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { FeedComposerSkeleton } from './_components/feed-composer/feed-composer-skeleton';
import { HomeFeedSkeleton } from './_components/home-feed';
import { HomeWeekSkeleton } from './_components/home-week';

/**
 * Home while the server builds it. The band already hangs from the navbar, so the bar does not turn
 * from glass to the band's ground when the page arrives, and everything holds the room it will take,
 * so nothing jumps.
 */
export default function HomeLoading() {
  return (
    <>
      <HangingBand as="div">
        <div
          className={cn(
            PAGE_COLUMN_WIDTH,
            BAND_TOP_SPACE,
            HOME_BAND_FOOT,
            'flex flex-col gap-4',
          )}
        >
          <SkeletonRegion>
            <Skeleton className="h-15 w-72 md:h-18 md:w-112" />
          </SkeletonRegion>
          <HomeWeekSkeleton />
        </div>
      </HangingBand>
      <div className={cn(PAGE_COLUMN_WIDTH, HOME_COMPOSER_OVERLAP)}>
        <FeedComposerSkeleton />
      </div>
      <div className={cn(PAGE_COLUMN, 'flex flex-col gap-6')}>
        <SkeletonRegion>
          <div className="flex items-center justify-between gap-3 pb-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-44" />
          </div>
        </SkeletonRegion>
        <HomeFeedSkeleton />
      </div>
    </>
  );
}
