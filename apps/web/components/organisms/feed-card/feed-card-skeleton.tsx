import { Skeleton } from '@/components/atoms/skeleton';
import { FEED_CARD_SURFACE } from './feed-card-surface.constant';

/** Enough cards to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

/** A card on Home still loading, line for line: who to whom, the corner, and the message. */
export function FeedCardSkeleton() {
  return (
    <div className={FEED_CARD_SURFACE}>
      <div className="flex items-start gap-3">
        <Skeleton shape="circle" className="size-8 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Skeleton className="w-3/4 text-subtitle-4" />
          <Skeleton className="w-1/2 text-body-3" />
        </div>
        <Skeleton
          shape="card"
          className="aspect-3/2 h-auto w-20 shrink-0 rounded-inner"
        />
      </div>
      <div className="flex flex-col">
        <Skeleton className="text-body-1" />
        <Skeleton className="w-4/5 text-body-1" />
      </div>
    </div>
  );
}

/** A list of cards still loading: a few cards, spaced as the lists on Home and Waiting space them. */
export function FeedCardSkeletonList() {
  return (
    <div className="flex flex-col gap-1.5">
      {PLACEHOLDERS.map((placeholder) => (
        <FeedCardSkeleton key={placeholder} />
      ))}
    </div>
  );
}
