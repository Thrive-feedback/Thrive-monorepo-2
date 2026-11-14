import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { readFeatureFlags } from '@/lib/feature-flags/feature-flags.service';
import { requireMember } from '@/lib/session/session.service';
import { DashboardSummary } from './_components/dashboard-summary';
import { FeedbackSummaryLoading } from './_components/feedback-summary-skeleton';

/**
 * Only reachable after signing in, and about one person, so there is nothing here to index. It asks
 * the flag too, so a dashboard that is switched off sends no title of its own with the 404 — and
 * the session first, as the layout does, so someone signed out is sent to sign in, never a 404.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [, { showsDashboard }] = await Promise.all([
    requireMember(),
    readFeatureFlags(),
  ]);
  if (!showsDashboard) {
    notFound();
  }
  return {
    title: 'Your dashboard',
    robots: { index: false, follow: false },
  };
}

/**
 * What the Feedback written to this person adds up to, read by them and nobody else.
 *
 * One block today — the summary — on a page built to hold more beside it later: how what people
 * say changes over time, who has written and in which shape. The full list of what was written
 * stays one press away in Received, which is what makes a short summary safe: the summary is the
 * shape of it, the list is the detail, and anything the caps leave out is still there to read.
 *
 * A deployment that has not switched it on answers as though it were not here (ADR 0087).
 */
export default async function Dashboard() {
  const [session, { showsDashboard }] = await Promise.all([
    requireMember(),
    readFeatureFlags(),
  ]);
  if (!showsDashboard) {
    notFound();
  }

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
