import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { FeedbackSummaryLoading } from './_components/feedback-summary-skeleton';

/**
 * The dashboard while the server builds it. The navbar and sidebar stay in place, so this holds
 * only this page's shape: its title, which is the same words either way, and the summary's card
 * in grey.
 */
export default function DashboardLoading() {
  return (
    <div className={cn(PAGE_COLUMN, 'flex flex-1 flex-col gap-8')}>
      <div className="flex flex-col gap-2">
        <PageTitle>Your dashboard</PageTitle>
        <Skeleton className="w-80 max-w-full text-body-2" />
      </div>
      <FeedbackSummaryLoading />
    </div>
  );
}
