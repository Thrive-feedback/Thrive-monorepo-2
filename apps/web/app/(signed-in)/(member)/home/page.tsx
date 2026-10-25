import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OneTimeToast } from '@/components/atoms/one-time-toast';
import { AnswerAskViewSkeleton } from '@/components/organisms/answer-ask-view';
import { FeedbackCardSkeleton } from '@/components/organisms/feedback-card';
import { FeedbackComposerSkeleton } from '@/components/organisms/feedback-composer';
import { FeedbackFeedSkeleton } from '@/components/organisms/feedback-feed';
import { HomeDialog } from '@/components/organisms/home-dialog';
import { WaitingAskListViewSkeleton } from '@/components/organisms/waiting-ask-list-view';
import { HomeView } from '@/components/templates/home-view';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { AnswerAskDetail } from './_components/answer-ask-detail';
import { FeedbackComposerCard } from './_components/feedback-composer-card';
import { FeedbackDetail } from './_components/feedback-detail';
import {
  FeedbackRequestDetail,
  FeedbackRequestDetailSkeleton,
} from './_components/feedback-request-detail';
import styles from './_components/home-split.module.css';
import { HomeTabPanel } from './_components/home-tab-panel';
import { InvitationNotices } from './_components/invitation-notices';
import { WaitingAskList } from './_components/waiting-ask-list';
import { WorkspaceFeed } from './_components/workspace-feed';
import { HomeSearchParams } from './_lib/home-search-params.schema';

/** Only reachable after signing in, so there is nothing here for a search engine. */
export const metadata: Metadata = {
  title: 'Home',
  robots: { index: false, follow: false },
};

type HomeProps = {
  /**
   * `signedIn` is set when Google sent a returning person back here, `sent` when they have just
   * sent a Feedback Request, `given` when they have just given Feedback without being asked,
   * `kudos` when they have just given Kudos,
   * `switched` when what they sent was dropped because its page was for a Workspace they are no
   * longer in, `opened` when they have just switched to this Workspace, `left` when they have just
   * left the one before, `tab` is the feed tab that
   * is open, and `request`, `ask` or `feedback` is the one open in a
   * dialog over it.
   */
  searchParams: Promise<{
    signedIn?: string | string[];
    sent?: string | string[];
    given?: string | string[];
    kudos?: string | string[];
    switched?: string | string[];
    opened?: string | string[];
    left?: string | string[];
    tab?: string | string[];
    request?: string | string[];
    ask?: string | string[];
    feedback?: string | string[];
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
 * A Feedback Request, an Ask or one piece of Feedback opens in a dialog over either layout,
 * drawn once. It is named in the address, so a reload or a shared link opens it again. Only one
 * can be open, and an address naming several is only reachable by hand: a request wins, then an
 * Ask, then Feedback — the order they were added, so a new parameter never changes what an
 * address that already worked opens.
 */
export default async function Home({ searchParams }: HomeProps) {
  const {
    signedIn,
    sent,
    given,
    kudos,
    switched,
    opened,
    left,
    tab,
    request,
    ask,
    feedback,
  } = HomeSearchParams.parse(await searchParams);
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
      {given !== undefined && (
        <OneTimeToast
          type="success"
          message="Feedback sent"
          then={ROUTES.homeTab(tab)}
        />
      )}
      {kudos !== undefined && (
        <OneTimeToast
          type="success"
          message="Kudos sent"
          then={ROUTES.homeTab(tab)}
        />
      )}
      {opened !== undefined && (
        <OneTimeToast
          type="success"
          message={`Switched to ${session.membership.workspace.name}`}
          then={ROUTES.homeTab(tab)}
        />
      )}
      {left !== undefined && (
        <OneTimeToast
          type="success"
          message={`You left that Workspace. You're in ${session.membership.workspace.name} now.`}
          then={ROUTES.homeTab(tab)}
        />
      )}
      {switched !== undefined && (
        <OneTimeToast
          type="error"
          message={`Nothing was changed: that page was for another Workspace. You're in ${session.membership.workspace.name} now.`}
          then={ROUTES.homeTab(tab)}
        />
      )}
      <HomeView
        workspaceName={session.membership.workspace.name}
        notices={
          // Most people have no Invitation waiting, so no space is held for one while it is read.
          <Suspense fallback={null}>
            <InvitationNotices />
          </Suspense>
        }
        composer={
          <Suspense fallback={<FeedbackComposerSkeleton />}>
            <FeedbackComposerCard
              membership={session.membership}
              ownEmail={session.email}
            />
          </Suspense>
        }
        workspaceFeed={
          <Suspense fallback={<FeedbackFeedSkeleton />}>
            <WorkspaceFeed membership={session.membership} />
          </Suspense>
        }
        waitingFor={(headingAs) => (
          <Suspense fallback={<WaitingAskListViewSkeleton />}>
            <WaitingAskList
              membership={session.membership}
              headingAs={headingAs}
            />
          </Suspense>
        )}
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
          <Suspense fallback={<FeedbackRequestDetailSkeleton />}>
            <FeedbackRequestDetail
              membership={session.membership}
              requestId={request}
            />
          </Suspense>
        </HomeDialog>
      ) : ask !== undefined ? (
        <HomeDialog
          key={ask}
          title="Give your feedback"
          close={{ href: ROUTES.homeTab(tab) }}
        >
          <Suspense fallback={<AnswerAskViewSkeleton />}>
            <AnswerAskDetail
              membership={session.membership}
              ownEmail={session.email}
              askId={ask}
            />
          </Suspense>
        </HomeDialog>
      ) : (
        feedback !== undefined && (
          <HomeDialog
            key={feedback}
            title="Feedback"
            close={{ href: ROUTES.homeTab(tab) }}
          >
            <Suspense fallback={<FeedbackCardSkeleton />}>
              <FeedbackDetail
                membership={session.membership}
                feedbackId={feedback}
              />
            </Suspense>
          </HomeDialog>
        )
      )}
    </>
  );
}
