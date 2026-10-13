import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { FeedbackComposerCard } from './_components/feedback-composer-card';
import { HomeTabs } from './_components/home-tabs';
import { HomeSearchParams } from './_lib/home-search-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

type HomeProps = {
  /**
   * `signedIn` is set when Google sent a returning person back here, `sent` when they have just
   * sent a Feedback Request, and `tab` is the feed tab that is open.
   */
  searchParams: Promise<{
    signedIn?: string | string[];
    sent?: string | string[];
    tab?: string | string[];
  }>;
};

/**
 * Home of the person's Workspace, where a Member lands after signing in; `/` stays public for
 * the landing page. On top, asking for Feedback or giving it; below, the Workspace's Feedback
 * and the person's own requests and Asks, one tab at a time. Who the person is now lives on
 * their Profile.
 */
export default async function Home({ searchParams }: HomeProps) {
  const { signedIn, sent, tab } = HomeSearchParams.parse(await searchParams);
  const session = await requireMember(signedIn);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {signedIn !== undefined && (
        <OneTimeToast
          type="success"
          message={`Signed in as ${session.email}`}
          then={ROUTES.homeTab(tab)}
        />
      )}
      {sent !== undefined && (
        <OneTimeToast
          type="success"
          message="Request sent"
          then={ROUTES.homeTab(tab)}
        />
      )}
      <Text variant="display-5" as="h1">
        {session.membership.workspace.name}
      </Text>
      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <FeedbackComposerCard
          membership={session.membership}
          ownEmail={session.email}
        />
      </Suspense>
      <HomeTabs tab={tab} membership={session.membership} />
    </div>
  );
}
