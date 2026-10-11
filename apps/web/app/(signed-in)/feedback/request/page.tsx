import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/atoms/skeleton';
import { requireMember } from '@/lib/session/session.service';
import { RequestFeedbackCard } from './_components/request-feedback-card';
import { RequestFeedbackHero } from './_components/request-feedback-hero';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Request feedback',
  robots: { index: false, follow: false },
};

/**
 * The check is in the page, not a layout, because a layout does not re-run when the client
 * navigates between the pages under it.
 */
export default async function RequestFeedbackPage() {
  const session = await requireMember();

  return (
    <div className="m-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-12">
      <RequestFeedbackHero />
      <Suspense
        fallback={
          <Skeleton className="h-80 w-full max-w-110 justify-self-center md:justify-self-end" />
        }
      >
        <RequestFeedbackCard
          membership={session.membership}
          ownEmail={session.email}
        />
      </Suspense>
    </div>
  );
}
