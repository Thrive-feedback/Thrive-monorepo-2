import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FeedbackPostcard } from '@/app/(signed-in)/(brand-new)/_components/feedback-postcard';
import { BRAND_NEW_COLUMN } from '@/app/(signed-in)/(brand-new)/_lib/brand-new-column.constant';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { ReceivedHeading } from './_components/received-heading';
import {
  ReceivedItems,
  ReceivedItemsLoading,
} from './_components/received-items';
import { BrandNewReceivedSearchParams } from './_lib/brand-new-received-search-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Received',
  robots: { index: false, follow: false },
};

type BrandNewReceivedProps = {
  /** `view` is how it is laid out, and `feedback` the piece open over it. */
  searchParams: Promise<{
    view?: string | string[];
    feedback?: string | string[];
  }>;
};

/**
 * Everything written to the person, kept like cards in a box: the postcards and Kudos they received,
 * newest first, as a grid of the real cards or as a list like Home's. Pressing a postcard opens it
 * over them, named in the address so a reload or a shared link opens it again.
 */
export default async function BrandNewReceived({
  searchParams,
}: BrandNewReceivedProps) {
  const { view, feedback } = BrandNewReceivedSearchParams.parse(
    await searchParams,
  );
  const { membership } = await requireMember();

  return (
    <>
      <div className={cn(BRAND_NEW_COLUMN, 'flex flex-col gap-6')}>
        <ReceivedHeading />
        <Suspense fallback={<ReceivedItemsLoading view={view} />}>
          <ReceivedItems membership={membership} />
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
            closeHref={ROUTES.brandNewReceivedViewing(view)}
          />
        )}
      </Suspense>
    </>
  );
}
