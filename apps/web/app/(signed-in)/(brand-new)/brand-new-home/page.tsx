import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { HomeFeed, HomeFeedSkeleton } from './_components/home-feed';
import { HomeFeedFilter } from './_components/home-feed-filter';
import { HomePostcard } from './_components/home-postcard';
import { BrandNewHomeSearchParams } from './_lib/brand-new-home-search-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

type BrandNewHomeProps = {
  /**
   * `opened` is set when the person has just switched to this Workspace from the navbar, `show` is
   * what the feed is showing, and `feedback` is the piece open over it.
   */
  searchParams: Promise<{
    opened?: string | string[];
    show?: string | string[];
    feedback?: string | string[];
  }>;
};

/**
 * The Home that will replace the one Members land on, in the letter concept of the design
 * workspace: what the Workspace shared with everyone and what somebody selected or mentioned the
 * person to read, in one list under a filter. Pressing a card opens the piece over it, named in
 * the address so a reload or a shared link opens it again.
 */
export default async function BrandNewHome({
  searchParams,
}: BrandNewHomeProps) {
  const { opened, show, feedback } = BrandNewHomeSearchParams.parse(
    await searchParams,
  );
  const session = await requireMember();

  return (
    <>
      {opened !== undefined && (
        <OneTimeToast
          type="success"
          message={`Switched to ${session.membership.workspace.name}`}
          then={ROUTES.brandNewHome}
        />
      )}
      <h1 className="sr-only">Home</h1>
      <div className="mx-auto flex w-full max-w-180 flex-col gap-4 px-4 py-8">
        <HomeFeedFilter show={show} />
        <Suspense key={show} fallback={<HomeFeedSkeleton />}>
          <HomeFeed membership={session.membership} show={show} />
        </Suspense>
      </div>
      {/* Always there, so a press holds the small postcard's pending mark until the postcard is
          ready, rather than committing to an empty fallback; a reload still does not wait. */}
      <Suspense fallback={null}>
        {feedback !== undefined && (
          <HomePostcard
            key={feedback}
            membership={session.membership}
            feedbackId={feedback}
            show={show}
          />
        )}
      </Suspense>
    </>
  );
}
