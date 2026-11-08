import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { requireMember } from '@/lib/session/session.service';
import { DashboardSummary } from './_components/dashboard-summary';
import { FeedbackSummaryLoading } from './_components/feedback-summary-skeleton';

/** Only reachable after signing in, and about one person, so there is nothing here to index. */
export const metadata: Metadata = {
  title: 'Your dashboard',
  robots: { index: false, follow: false },
};

/**
 * What the Feedback written to this person adds up to, read by them and nobody else.
 *
 * One block today — the summary — on a page built to hold more beside it later: how what people
 * say changes over time, who has written and in which shape. The full list of what was written
 * stays one press away in Received, which is what makes a short summary safe: the summary is the
 * shape of it, the list is the detail, and anything the caps leave out is still there to read.
 */
export default async function Dashboard() {
  const session = await requireMember();

  return (
    <div className={cn(PAGE_COLUMN, 'flex flex-1 flex-col gap-8')}>
      <div className="flex flex-col gap-2">
        <PageTitle>Your dashboard</PageTitle>
        <Text as="p" variant="body-2" tone="muted">
          What people have written to you, read back to you. Nobody else sees
          this page.
        </Text>
      </div>
      <Suspense fallback={<FeedbackSummaryLoading />}>
        <DashboardSummary session={session} />
      </Suspense>
    </div>
  );
}
