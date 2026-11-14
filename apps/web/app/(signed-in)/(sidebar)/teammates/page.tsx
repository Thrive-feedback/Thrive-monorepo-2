import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { cn } from '@/lib/cn.util';
import { requireMember } from '@/lib/session/session.service';
import { Teammates, TeammatesSkeleton } from './_components/teammates';
import { TeammatesHead } from './_components/teammates-head';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Teammates',
  robots: { index: false, follow: false },
};

/**
 * Everyone the person works with in their Workspace, each a press away from Feedback given, asked
 * for, or a Kudos. Roles and Invitations are Settings' to manage, not this page's.
 */
export default async function TeammatesPage() {
  const session = await requireMember();

  return (
    <div className={cn(PAGE_COLUMN, 'flex flex-1 flex-col gap-8')}>
      <TeammatesHead workspaceName={session.membership.workspace.name} />
      <Suspense fallback={<TeammatesSkeleton />}>
        <Teammates session={session} />
      </Suspense>
    </div>
  );
}
