import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FeedbackPostcard } from '@/app/(signed-in)/(sidebar)/_components/feedback-postcard';
import { InvitationNotices } from '@/app/(signed-in)/(sidebar)/_components/invitation-notices';
import { PageTitle } from '@/app/(signed-in)/(sidebar)/_components/page-title';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { HandwrittenNote } from '@/components/molecules/handwritten-note';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { FeedComposerSkeleton } from './_components/feed-composer/feed-composer-skeleton';
import { HomeComposer } from './_components/home-composer';
import { HomeFeed, HomeFeedSkeleton } from './_components/home-feed';
import { HomeFeedFilter } from './_components/home-feed-filter';
import { HomeSearchParams } from './_lib/home-search-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

type HomeProps = {
  /**
   * `signedIn` is set when Google sent a returning person back here, `opened` when they have just
   * switched to this Workspace from the navbar, `left` when they have just left the one before,
   * and `switched` when what they sent was dropped because its page was for a Workspace they are
   * no longer in. `show` is what the feed is showing, and `feedback` is the piece open over it.
   */
  searchParams: Promise<{
    signedIn?: string | string[];
    opened?: string | string[];
    left?: string | string[];
    switched?: string | string[];
    show?: string | string[];
    feedback?: string | string[];
  }>;
};

/**
 * Home of the person's Workspace, where a Member lands after signing in, in the letter concept of
 * the design workspace: what the Workspace shared with everyone and what somebody selected or
 * mentioned the person to read, in one list under a filter. Pressing a card opens the piece over
 * it, named in the address so a reload or a shared link opens it again.
 */
export default async function Home({ searchParams }: HomeProps) {
  const { signedIn, opened, left, switched, show, feedback } =
    HomeSearchParams.parse(await searchParams);
  const session = await requireMember(signedIn);
  const workspaceName = session.membership.workspace.name;
  const showing = ROUTES.homeShowing(show);

  return (
    <>
      {signedIn !== undefined && (
        <OneTimeToast
          type="success"
          message={`Signed in as ${session.email}`}
          then={showing}
        />
      )}
      {opened !== undefined && (
        <OneTimeToast
          type="success"
          message={`Switched to ${workspaceName}`}
          then={showing}
        />
      )}
      {left !== undefined && (
        <OneTimeToast
          type="success"
          message={`You left that Workspace. You're in ${workspaceName} now.`}
          then={showing}
        />
      )}
      {switched !== undefined && (
        <OneTimeToast
          type="error"
          message={`Nothing was changed: that page was for another Workspace. You're in ${workspaceName} now.`}
          then={showing}
        />
      )}
      <div className={cn(PAGE_COLUMN, 'flex flex-1 flex-col gap-8')}>
        {/* Most people have no Invitation waiting, so no space is held for one while it is read. */}
        <Suspense fallback={null}>
          <InvitationNotices />
        </Suspense>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-x-3">
            <PageTitle>Home</PageTitle>
            <HandwrittenNote size="md" className="-translate-y-1.5">
              say it while it's fresh
            </HandwrittenNote>
          </div>
          <Suspense fallback={<FeedComposerSkeleton />}>
            <HomeComposer
              session={session}
              isUnderPostcard={feedback !== undefined}
            />
          </Suspense>
        </div>
        {/* Grows to the foot of the page, so an empty feed sits in the middle of what is left. The
            gap clears the note by hand that rises above the first card's small postcard. */}
        <div className="flex flex-1 flex-col gap-11">
          <div className="flex items-center justify-end gap-3 md:justify-between">
            <HandwrittenNote size="md" tilt="left" className="hidden md:block">
              what your team's been saying
            </HandwrittenNote>
            <HomeFeedFilter show={show} />
          </div>
          <Suspense key={show} fallback={<HomeFeedSkeleton />}>
            <HomeFeed membership={session.membership} show={show} />
          </Suspense>
        </div>
      </div>
      {/* Always there, so a press holds the small postcard's pending mark until the postcard is
          ready, rather than committing to an empty fallback; a reload still does not wait. */}
      <Suspense fallback={null}>
        {feedback !== undefined && (
          <FeedbackPostcard
            key={feedback}
            membership={session.membership}
            feedbackId={feedback}
            closeHref={showing}
          />
        )}
      </Suspense>
    </>
  );
}
