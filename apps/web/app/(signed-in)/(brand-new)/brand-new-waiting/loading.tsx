import { BrandNewPageTitle } from '@/app/(signed-in)/(brand-new)/_components/brand-new-page-title';
import { BRAND_NEW_COLUMN } from '@/app/(signed-in)/(brand-new)/_lib/brand-new-column.constant';
import { cn } from '@/lib/cn.util';
import { WaitingAsksSkeleton } from './_components/waiting-asks';

/**
 * Waiting for me while the server builds it. The navbar and sidebar stay in place, so this holds
 * the list's column in grey.
 */
export default function BrandNewWaitingLoading() {
  return (
    <div className={cn(BRAND_NEW_COLUMN, 'flex flex-col gap-4')}>
      <BrandNewPageTitle>Waiting for me</BrandNewPageTitle>
      <WaitingAsksSkeleton />
    </div>
  );
}
