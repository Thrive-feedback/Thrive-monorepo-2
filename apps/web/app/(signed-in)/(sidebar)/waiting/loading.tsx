import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { WaitingAsksSkeleton } from './_components/waiting-asks';

/**
 * Waiting for me while the server builds it. The navbar and sidebar stay in place, so this holds
 * the column in grey, the row for the order included, so the list does not jump when it arrives.
 */
export default function WaitingLoading() {
  return (
    <div className={cn(PAGE_COLUMN, 'flex flex-col gap-11')}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <PageTitle>Waiting for me</PageTitle>
        <Skeleton className="ms-auto h-10 w-32 md:w-44" />
      </div>
      <WaitingAsksSkeleton />
    </div>
  );
}
