import { BrandNewPageTitle } from '@/app/(signed-in)/(brand-new)/_components/brand-new-page-title';
import { BRAND_NEW_COLUMN } from '@/app/(signed-in)/(brand-new)/_lib/brand-new-column.constant';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { WaitingAsksSkeleton } from './_components/waiting-asks';

/**
 * Waiting for me while the server builds it. The navbar and sidebar stay in place, so this holds
 * the column in grey, the row for the order included, so the list does not jump when it arrives.
 */
export default function BrandNewWaitingLoading() {
  return (
    <div className={cn(BRAND_NEW_COLUMN, 'flex flex-col gap-4')}>
      <BrandNewPageTitle>Waiting for me</BrandNewPageTitle>
      <Skeleton className="h-10 w-full md:w-64" />
      <WaitingAsksSkeleton />
    </div>
  );
}
