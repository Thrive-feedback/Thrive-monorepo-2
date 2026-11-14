import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { TeammatesSkeleton } from './_components/teammates';

/**
 * Teammates while the server builds it. The navbar and sidebar stay in place, so this holds the
 * column in grey, the line under the title included, so nothing jumps when the page arrives. The
 * note by hand is left to the page, so it writes itself once.
 */
export default function TeammatesLoading() {
  return (
    <div className={cn(PAGE_COLUMN, 'flex flex-1 flex-col gap-8')}>
      <div className="flex flex-col gap-2">
        <PageTitle>Teammates</PageTitle>
        <Skeleton className="h-5 w-48" />
      </div>
      <TeammatesSkeleton />
    </div>
  );
}
