import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FeedbackPostcard } from '@/app/(signed-in)/(sidebar)/_components/feedback-postcard';
import {
  BAND_TOP_SPACE,
  HangingBand,
} from '@/app/(signed-in)/(sidebar)/_components/hanging-band';
import { InvitationNotices } from '@/app/(signed-in)/(sidebar)/_components/invitation-notices';
import {
  PAGE_COLUMN,
  PAGE_COLUMN_WIDTH,
} from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import {
  HOME_BAND_FOOT,
  HOME_COMPOSER_OVERLAP,
} from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { BackToTop } from './_components/back-to-top';
import { FeedComposerSkeleton } from './_components/feed-composer/feed-composer-skeleton';
import { HomeComposer } from './_components/home-composer';
import { HomeDayJumpProvider } from './_components/home-day-jump';
import { HomeFeed, HomeFeedSkeleton } from './_components/home-feed';
import { HomeFeedFilter } from './_components/home-feed-filter';
import { HomeWeek, HomeWeekSkeleton } from './_components/home-week';
import { HomeSearchParams } from './_lib/home-search-params.schema';

/** The page's heading, which the button back to the top returns focus to. */
const HOME_HEADING = 'home-heading';

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
 * Home of the person's Workspace, where a Member lands after signing in. Its head hangs from the
 * navbar as a Profile's does, headed Home, with what the last seven days held and a
 * ribbon of those days; the composer lies across the head's foot. Below, what the Workspace shared
 * with everyone and what somebody selected or mentioned the person to read, in days, under a
 * filter. Pressing a card opens the piece over it, named in the address so a reload or a shared
 * link opens it again.
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
      <HomeDayJumpProvider>
        <HangingBand>
          <div
            className={cn(
              PAGE_COLUMN_WIDTH,
              BAND_TOP_SPACE,
              HOME_BAND_FOOT,
              'flex flex-col gap-4',
            )}
          >
            <Text as="h1" variant="display-1" id={HOME_HEADING} tabIndex={-1}>
              Home
            </Text>
            <Suspense key={show} fallback={<HomeWeekSkeleton />}>
              <HomeWeek membership={session.membership} show={show} />
            </Suspense>
          </div>
        </HangingBand>
        {/* After the band, never inside it: it lies across the band's foot, which the band's mask
            would cut, and the band takes no presses. */}
        <div className={cn(PAGE_COLUMN_WIDTH, HOME_COMPOSER_OVERLAP)}>
          <Suspense fallback={<FeedComposerSkeleton />}>
            <HomeComposer
              session={session}
              isUnderPostcard={feedback !== undefined}
            />
          </Suspense>
        </div>
        <div className={cn(PAGE_COLUMN, 'flex flex-1 flex-col gap-6')}>
          {/* Most people have no Invitation waiting, so no space is held for one while it is read.
              Under the band, so arriving late it cannot push the band down. */}
          <Suspense fallback={null}>
            <InvitationNotices />
          </Suspense>
          <div className="flex flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
              <Text as="h2" variant="display-6">
                Day by day
              </Text>
              <HomeFeedFilter show={show} />
            </div>
            <Suspense key={show} fallback={<HomeFeedSkeleton />}>
              <HomeFeed membership={session.membership} show={show} />
            </Suspense>
          </div>
        </div>
        <BackToTop headingId={HOME_HEADING} />
      </HomeDayJumpProvider>
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
