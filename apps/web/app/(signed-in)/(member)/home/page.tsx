import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { Skeleton } from '@/components/atoms/skeleton';
import { FeedbackFeed } from '@/components/organisms/feedback-feed';
import { HomeDialog } from '@/components/organisms/home-dialog';
import { HomeView } from '@/components/templates/home-view';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { AnswerAskDetail } from './_components/answer-ask-detail';
import { FeedbackComposerCard } from './_components/feedback-composer-card';
import { FeedbackRequestDetail } from './_components/feedback-request-detail';
import styles from './_components/home-split.module.css';
import { HomeTabPanel } from './_components/home-tab-panel';
import { previewWorkspaceFeed } from './_lib/feed.mock';
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
 * On a wide screen, the Workspace feed and the rest side by side; `HomeView` draws both. Both are
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
      <HomeView
        workspaceName={session.membership.workspace.name}
        composer={
          <Suspense fallback={<Skeleton shape="card" className="h-80" />}>
            <FeedbackComposerCard
              membership={session.membership}
              ownEmail={session.email}
            />
          </Suspense>
        }
        workspaceFeed={
          <FeedbackFeed
            items={previewWorkspaceFeed()}
            isPreviewData
            emptyMessage="Nothing has been shared with everyone yet."
          />
        }
        tab={tab}
        targetFor={(value) => ({ href: ROUTES.homeTab(value) })}
        panelFor={(value) => (
          <HomeTabPanel tab={value} membership={session.membership} />
        )}
        splitClassName={styles.split}
      />
      {request !== undefined ? (
        <HomeDialog
          key={request}
          title="Your feedback request"
          close={{ href: ROUTES.homeTab(tab) }}
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
            close={{ href: ROUTES.homeTab(tab) }}
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
