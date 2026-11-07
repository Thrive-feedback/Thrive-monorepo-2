import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FeedbackPostcard } from '@/app/(signed-in)/(sidebar)/_components/feedback-postcard';
import { PersonalItemsHeading } from '@/app/(signed-in)/(sidebar)/_components/personal-items-heading';
import { PersonalItemsLoading } from '@/app/(signed-in)/(sidebar)/_components/personal-items-skeleton';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { PersonalItemsSearchParams } from '@/app/(signed-in)/(sidebar)/_lib/personal-items-search-params.schema';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { GivenItems } from './_components/given-items';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Given',
  robots: { index: false, follow: false },
};

type GivenProps = {
  /** `view` is how it is laid out, and `feedback` the piece open over it. */
  searchParams: Promise<{
    view?: string | string[];
    feedback?: string | string[];
  }>;
};

/**
 * Everything the person wrote, kept like cards in a box: the postcards and Kudos they gave, newest
 * first, as a grid of the real cards or as a list like Home's. Pressing a postcard opens it over
 * them, named in the address so a reload or a shared link opens it again.
 */
export default async function Given({ searchParams }: GivenProps) {
  const { view, feedback } = PersonalItemsSearchParams.parse(
    await searchParams,
  );
  const session = await requireMember();

  return (
    <>
      <div className={cn(PAGE_COLUMN, 'flex flex-1 flex-col gap-6')}>
        <PersonalItemsHeading side="given" />
        <Suspense fallback={<PersonalItemsLoading view={view} />}>
          <GivenItems session={session} />
        </Suspense>
      </div>
      {/* Always there, so a press holds the box's pending mark until the postcard is ready, rather
          than committing to an empty fallback; a reload still does not wait. */}
      <Suspense fallback={null}>
        {feedback !== undefined && (
          <FeedbackPostcard
            key={feedback}
            membership={session.membership}
            feedbackId={feedback}
            closeHref={ROUTES.givenViewing(view)}
          />
        )}
      </Suspense>
    </>
  );
}
