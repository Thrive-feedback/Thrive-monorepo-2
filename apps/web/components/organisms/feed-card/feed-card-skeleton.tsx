import { Skeleton } from '@/components/atoms/skeleton';
import { FeedCardColumns } from './feed-card-columns';

/** Enough cards to fill the first screen, without promising how many will come. */
const PLACEHOLDERS = ['first', 'second', 'third'] as const;

/** A card in a list still loading, line for line: who to whom, the message, and its card beside them. */
export function FeedCardSkeleton() {
  return (
    <FeedCardColumns
      tone="primary"
      aside={
        <Skeleton
          shape="card"
          className="aspect-3/2 h-auto w-28 rounded-inner"
        />
      }
    >
      <div className="flex items-center gap-2">
        <Skeleton shape="circle" className="size-6 shrink-0" />
        <Skeleton className="w-3/4 text-subtitle-4" />
      </div>
      <Skeleton className="w-1/2 text-body-3" />
      <div className="flex flex-col">
        <Skeleton className="text-body-1" />
        <Skeleton className="w-4/5 text-body-1" />
      </div>
    </FeedCardColumns>
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
