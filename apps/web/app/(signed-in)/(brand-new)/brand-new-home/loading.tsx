import { BrandNewPageTitle } from '@/app/(signed-in)/(brand-new)/_components/brand-new-page-title';
import { BRAND_NEW_COLUMN } from '@/app/(signed-in)/(brand-new)/_lib/brand-new-column.constant';
import { FeedComposerSkeleton } from '@/components/organisms/feed-composer/feed-composer-skeleton';
import { cn } from '@/lib/cn.util';
import { HomeFeedSkeleton } from './_components/home-feed';

/**
 * The new Home while the server builds it. The navbar and sidebar stay in place, so this holds the
 * feed's column in grey.
 */
export default function BrandNewHomeLoading() {
  return (
    <div className={cn(BRAND_NEW_COLUMN, 'flex flex-col gap-8')}>
      <div className="flex flex-col gap-4">
        <BrandNewPageTitle>Home</BrandNewPageTitle>
        <FeedComposerSkeleton />
      </div>
      <HomeFeedSkeleton />
    </div>
  );
}
