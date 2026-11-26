import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import {
  FEED_COMPOSER_CHOICE,
  FEED_COMPOSER_CHOICES,
  FEED_COMPOSER_SURFACE,
} from './feed-composer.constant';

/** A `FeedComposer` still loading, line for line. */
export function FeedComposerSkeleton() {
  return (
    <div className={FEED_COMPOSER_SURFACE}>
      <div className="flex items-end gap-3">
        <Skeleton shape="circle" className="size-8 shrink-0" />
        <Skeleton className="h-10 flex-1" />
      </div>
      <div className={FEED_COMPOSER_CHOICES}>
        <Skeleton className={cn('h-10', FEED_COMPOSER_CHOICE)} />
        <Skeleton className={cn('h-10', FEED_COMPOSER_CHOICE)} />
        <Skeleton className={cn('h-10', FEED_COMPOSER_CHOICE)} />
      </div>
    </div>
  );
}
