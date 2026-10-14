import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { AnswerAskDetail } from './_components/answer-ask-detail';
import { FeedbackComposerCard } from './_components/feedback-composer-card';
import { FeedbackRequestDetail } from './_components/feedback-request-detail';
import { HomeDialog } from './_components/home-dialog';
import { HomeSplitView } from './_components/home-split-view';
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
   * sent a Feedback Request, `tab` is the feed tab that is open, and `request` or `ask` is the
   * one open in a dialog over it.
   */
  searchParams: Promise<{
    signedIn?: string | string[];
    sent?: string | string[];
    tab?: string | string[];
    request?: string | string[];
    ask?: string | string[];
  }>;
};

/**
 * Home of the person's Workspace, where a Member lands after signing in; `/` stays public for
 * the landing page. On a narrow screen, one column: asking for Feedback or giving it on top,
 * and below, the Workspace's Feedback and the person's own requests and Asks, one tab at a time.
 * On a wide screen, the Workspace feed and the rest side by side (`HomeSplitView`). Both are
 * drawn and CSS shows one, so the page needs no script to choose; each read is deduplicated, so
 * drawing both reads the API once. Who the person is now lives on their Profile.
 *
 * A Feedback Request or an Ask opens in a dialog over either layout, drawn once. It is named in
 * the address, so a reload or a shared link opens it again; a request wins if both are named.
 */
export default async function Home({ searchParams }: HomeProps) {
  const { signedIn, sent, tab, request, ask } = HomeSearchParams.parse(
    await searchParams,
  );
  const session = await requireMember(signedIn);

  return (
    <>
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 lg:hidden">
        <Text variant="display-5" as="h1">
          {session.membership.workspace.name}
        </Text>
        <Suspense fallback={<Skeleton shape="card" className="h-80" />}>
          <FeedbackComposerCard
            membership={session.membership}
            ownEmail={session.email}
          />
        </Suspense>
        <HomeTabs tab={tab} membership={session.membership} />
      </div>
      <HomeSplitView
        tab={tab}
        membership={session.membership}
        ownEmail={session.email}
        className="hidden lg:block"
      />
      {request !== undefined ? (
        <HomeDialog
          key={request}
          title="Your feedback request"
          closeHref={ROUTES.homeTab(tab)}
        >
          <Suspense fallback={<Skeleton shape="card" className="h-40" />}>
            <FeedbackRequestDetail
              membership={session.membership}
              requestId={request}
            />
          </Suspense>
        </HomeDialog>
      ) : (
        ask !== undefined && (
          <HomeDialog
            key={ask}
            title="Give your feedback"
            closeHref={ROUTES.homeTab(tab)}
          >
            <Suspense fallback={<Skeleton shape="card" className="h-40" />}>
              <AnswerAskDetail membership={session.membership} askId={ask} />
            </Suspense>
          </HomeDialog>
        )
      )}
    </>
  );
}
