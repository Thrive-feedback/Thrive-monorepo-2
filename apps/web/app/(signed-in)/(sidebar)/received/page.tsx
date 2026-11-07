import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FeedbackPostcard } from '@/app/(signed-in)/(sidebar)/_components/feedback-postcard';
import { PersonalItemsHeading } from '@/app/(signed-in)/(sidebar)/_components/personal-items-heading';
import { PersonalItemsLoading } from '@/app/(signed-in)/(sidebar)/_components/personal-items-skeleton';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { ReceivedItemsSearchParams } from '@/app/(signed-in)/(sidebar)/_lib/personal-items-search-params.schema';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { ReceivedFilter } from './_components/received-filter';
import { ReceivedItems } from './_components/received-items';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Received',
  robots: { index: false, follow: false },
};

type ReceivedProps = {
  /** `view` is how it is laid out, `show` what kind it is narrowed to, and `feedback` the piece open over it. */
  searchParams: Promise<{
    view?: string | string[];
    show?: string | string[];
    feedback?: string | string[];
  }>;
};

/**
 * Everything that comes back to the person, kept like cards in a box: the postcards and Kudos they
 * received and the requests they sent, each with its answers, newest first, as a grid of the real
 * cards or as a list like Home's, all of it or one kind. Pressing a postcard opens it over them,
 * named in the address so a reload or a shared link opens it again.
 */
export default async function Received({ searchParams }: ReceivedProps) {
  const { view, show, feedback } = ReceivedItemsSearchParams.parse(
    await searchParams,
  );
  const { membership } = await requireMember();

  return (
    <>
      <div className={cn(PAGE_COLUMN, 'flex flex-col gap-6')}>
        <div className="flex flex-col gap-4">
          <PersonalItemsHeading side="received" />
          <ReceivedFilter show={show} />
        </div>
        {/* Keyed by the choice, so another one starts its own list rather than adding to this one. */}
        <Suspense key={show} fallback={<PersonalItemsLoading view={view} />}>
          <ReceivedItems membership={membership} show={show} />
        </Suspense>
      </div>
      {/* Always there, so a press holds the box's pending mark until the postcard is ready, rather
          than committing to an empty fallback; a reload still does not wait. */}
      <Suspense fallback={null}>
        {feedback !== undefined && (
          <FeedbackPostcard
            key={feedback}
            membership={membership}
            feedbackId={feedback}
            closeHref={ROUTES.receivedViewing(view, show)}
          />
        )}
      </Suspense>
    </>
  );
}
