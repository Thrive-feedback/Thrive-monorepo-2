import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { FeedComposerSkeleton } from './_components/feed-composer/feed-composer-skeleton';
import { HomeFeedSkeleton } from './_components/home-feed';

/**
 * Home while the server builds it. The navbar and sidebar stay in place, so this holds the
 * feed's column in grey, the row for its filter included, so the list does not jump when it arrives.
 */
export default function HomeLoading() {
  return (
    <div className={cn(PAGE_COLUMN, 'flex flex-col gap-8')}>
      <div className="flex flex-col gap-4">
        <PageTitle>Home</PageTitle>
        <FeedComposerSkeleton />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-44 self-end" />
        <HomeFeedSkeleton />
      </div>
    </div>
  );
}
