import { Suspense } from 'react';
import { FeedbackFeedSkeleton } from '@/components/organisms/feedback-feed';
import { SentRequestListViewSkeleton } from '@/components/organisms/sent-request-list-view';
import { WaitingAskListViewSkeleton } from '@/components/organisms/waiting-ask-list-view';
import type { HomeTab } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { ReceivedFeedbackList } from './received-feedback-list';
import { SentRequestList } from './sent-request-list';
import { SharedFeedbackList } from './shared-feedback-list';
import { WaitingAskList } from './waiting-ask-list';
import { WorkspaceFeed } from './workspace-feed';

export type HomeTabPanelProps = {
  tab: HomeTab;
  membership: CurrentMembership;
};

/** What each tab looks like while its list is read: the list's own shape, in grey. */
const TAB_SKELETONS: Readonly<Record<HomeTab, React.ReactNode>> = {
  workspace: <FeedbackFeedSkeleton />,
  shared: <FeedbackFeedSkeleton />,
  'my-requests': <SentRequestListViewSkeleton />,
  waiting: <WaitingAskListViewSkeleton />,
  received: <FeedbackFeedSkeleton />,
};

/**
 * What one of Home's tabs holds. Only the open tab is drawn, so only its data is read. The
 * boundary is keyed by tab, so a tab shows its own skeleton while it loads rather than the tab
 * that was open before.
 */
export function HomeTabPanel({ tab, membership }: HomeTabPanelProps) {
  return (
    <Suspense key={tab} fallback={TAB_SKELETONS[tab]}>
      <TabContent tab={tab} membership={membership} />
    </Suspense>
  );
}

function TabContent({ tab, membership }: HomeTabPanelProps) {
  switch (tab) {
    case 'workspace':
      return <WorkspaceFeed membership={membership} />;
    case 'shared':
      return <SharedFeedbackList membership={membership} />;
    case 'my-requests':
      return <SentRequestList membership={membership} />;
    case 'waiting':
      return <WaitingAskList membership={membership} />;
    case 'received':
      return <ReceivedFeedbackList membership={membership} />;
  }
}
