import type { Metadata } from 'next';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { FeedbackPostcard } from '@/app/(signed-in)/(sidebar)/_components/feedback-postcard';
import { PersonalItemsLoading } from '@/app/(signed-in)/(sidebar)/_components/personal-items-skeleton';
import { PAGE_COLUMN } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import { toSessionWriter } from '@/app/(signed-in)/(sidebar)/_lib/postcard-writer.util';
import { Button } from '@/components/atoms/button';
import { cn } from '@/lib/cn.util';
import { readTeammates } from '@/lib/feedback/teammates.service';
import { readWorkspaceGoalNames } from '@/lib/feedback/workspace-goal-names.service';
import { PERSONAL_VIEWS, ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { ProfileComposeActions } from './_components/profile-compose-actions';
import { ProfileFilter } from './_components/profile-filter';
import { ProfileHeader } from './_components/profile-header';
import { ProfileItems } from './_components/profile-items';
import { readProfile } from './_lib/profile.service';
import {
  ProfileParams,
  ProfileSearchParams,
} from './_lib/profile-params.schema';
import { profileShowOf, profileShowsFor } from './_lib/profile-shows.util';

/** Only reachable after signing in, and about one person, so there is nothing here to index. */
export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
};

type ProfilePageProps = {
  params: Promise<{ slug: string }>;
  /** `show` is the open list, and `feedback` the piece open over it. */
  searchParams: Promise<{
    show?: string | string[];
    feedback?: string | string[];
  }>;
};

/**
 * Anyone's Profile in the Workspace, the reader's own included: who they are and where they stand
 * there, then what was written to them that the reader may read from outside — the Feedback shown to
 * everyone, asked for or not; on someone else's, the Feedback somebody shared with the reader, in a
 * list of its own; and the Kudos that name them. The reader's own shows them what everyone sees; the
 * rest of what was written to them is in Received.
 *
 * On someone else's, Give, Ask and Kudos open that card for them, unless they have left. On the
 * reader's own, the way on is their Account in Settings. Pressing a postcard opens it over the
 * Profile, named in the address so a reload or a shared link opens it again.
 */
export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const parsed = ProfileParams.safeParse(await params);
  if (!parsed.success) {
    notFound();
  }
  const { slug } = parsed.data;
  const { show: asked, feedback } = ProfileSearchParams.parse(
    await searchParams,
  );
  const session = await requireMember();
  const { membership } = session;
  const isYou = slug === session.profile.slug;
  const shows = profileShowsFor(isYou);
  const show = profileShowOf(asked, shows);
  // Who a card can be for and the Workspace Goals are only for someone else's Profile, and are read
  // beside it rather than after, since they do not depend on it.
  const [profile, teammates, workspaceGoals] = await Promise.all([
    readProfile(membership, slug),
    isYou ? [] : readTeammates(membership, session.email),
    isYou ? [] : readWorkspaceGoalNames(membership),
  ]);
  if (!profile) {
    notFound();
  }
  const teammate = profile.isDeactivated
    ? undefined
    : teammates.find(({ accountId }) => accountId === profile.accountId);

  return (
    <>
      <ProfileHeader profile={profile} isYou={isYou}>
        {isYou ? (
          <Button asChild variant="secondary" size="sm">
            <NextLink href={ROUTES.settings.account}>Account settings</NextLink>
          </Button>
        ) : (
          teammate && (
            <ProfileComposeActions
              teammate={teammate}
              teammates={teammates}
              workspaceId={membership.workspace.id}
              workspaceGoals={workspaceGoals}
              writer={toSessionWriter(session)}
            />
          )
        )}
      </ProfileHeader>
      <div className={cn(PAGE_COLUMN, 'flex flex-1 flex-col gap-6')}>
        <ProfileFilter slug={profile.slug} shows={shows} show={show} />
        <Suspense
          key={show}
          fallback={<PersonalItemsLoading view={PERSONAL_VIEWS[0]} />}
        >
          <ProfileItems
            membership={membership}
            profile={profile}
            show={show}
            isYou={isYou}
          />
        </Suspense>
      </div>
      {/* Always there, so a press holds the card's pending mark until the postcard is ready, rather
          than committing to an empty fallback; a reload still does not wait. */}
      <Suspense fallback={null}>
        {feedback !== undefined && (
          <FeedbackPostcard
            key={feedback}
            membership={membership}
            feedbackId={feedback}
            closeHref={ROUTES.profileShowing(profile.slug, show)}
          />
        )}
      </Suspense>
    </>
  );
}
