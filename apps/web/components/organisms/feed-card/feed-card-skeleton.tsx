import { Skeleton } from '@/components/atoms/skeleton';

/** A card on Home still loading, line for line: who to whom, the corner, and the message. */
export function FeedCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-page bg-action-primary/8 p-5">
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
