import {
  BAND_TOP_SPACE,
  HangingBand,
  HangingBandFoot,
} from '@/app/(signed-in)/(sidebar)/_components/hanging-band';
import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import {
  PAGE_COLUMN,
  PAGE_COLUMN_WIDTH,
} from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import {
  HOME_BAND_FOOT,
  HOME_BAND_LAYER,
  HOME_COMPOSER_OVERLAP,
  HOME_COMPOSER_ROW,
  HOME_COMPOSER_STUCK,
  HOME_HEADING_ROOM,
  HOME_STUCK_FOOT,
} from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import { Skeleton, SkeletonRegion } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { FeedComposerSkeleton } from './_components/feed-composer/feed-composer-skeleton';
import { HomeFeedSkeleton } from './_components/home-feed';
import { HomeHead } from './_components/home-head';
import { HomeWeekSkeleton } from './_components/home-week';

/**
 * Home while the server builds it. The band already hangs from the navbar, so the bar does not turn
 * from glass to the band's ground when the page arrives, the heading is already Home, as the Kudos
 * board's is while it loads, and everything holds the room it will take, so nothing jumps. The small
 * week waits for the page: it shows only once the composer has stuck.
 */
export default function HomeLoading() {
  return (
    <>
      <HomeHead>
        <PageTitle>Home</PageTitle>
      </HomeHead>
      <HangingBand as="div" className={HOME_BAND_LAYER}>
        <div
          className={cn(
            PAGE_COLUMN_WIDTH,
            BAND_TOP_SPACE,
            HOME_BAND_FOOT,
            'flex flex-col gap-4',
          )}
        >
          <div className={HOME_HEADING_ROOM} />
          <HomeWeekSkeleton />
        </div>
      </HangingBand>
      <HangingBandFoot className={HOME_STUCK_FOOT} />
      <div
        className={cn(
          PAGE_COLUMN_WIDTH,
          HOME_COMPOSER_OVERLAP,
          HOME_COMPOSER_STUCK,
          HOME_COMPOSER_ROW,
        )}
      >
        <div className="flex-1">
          <FeedComposerSkeleton />
        </div>
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
