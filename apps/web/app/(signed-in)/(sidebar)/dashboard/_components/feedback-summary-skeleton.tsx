import { Card, CardContent, CardHeader } from '@/components/atoms/card';
import { Skeleton } from '@/components/atoms/skeleton';

/** One block of the summary in grey: its heading, then a few lines of what it will say. */
function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="w-48 text-subtitle-handwrite-3" />
      <div className="flex flex-col gap-2 border-border-subtle border-s-2 ps-4">
        <Skeleton className="text-body-1" />
        <Skeleton className="w-4/5 text-body-1" />
      </div>
    </div>
  );
}

/**
 * The summary while the server reads it. It holds the card's own shape, so the page does not
 * jump when the real one arrives — and the heading above it is already drawn by the page.
 */
export function FeedbackSummaryLoading() {
  return (
    <Card aria-busy="true" aria-label="Reading your summary">
      <CardHeader className="items-start gap-2 text-start">
        <Skeleton className="w-40 text-subtitle-2" />
        <Skeleton className="w-64 text-body-2" />
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
      </CardContent>
    </Card>
  );
}
