import { previewWorkspaceFeed } from '@/app/(signed-in)/(member)/home/_lib/feed.mock';
import { FeedbackFeed } from '@/components/organisms/feedback-feed';
import type { HomeTab } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { ReceivedFeedbackList } from './received-feedback-list';
import { SentRequestList } from './sent-request-list';
import { SharedFeedbackList } from './shared-feedback-list';
import { WaitingAskList } from './waiting-ask-list';

export type HomeTabPanelProps = {
  tab: HomeTab;
  membership: CurrentMembership;
};

/** What one of Home's tabs holds. Only the open tab is drawn, so only its data is read. */
export function HomeTabPanel({ tab, membership }: HomeTabPanelProps) {
  switch (tab) {
    case 'workspace':
      return (
        <FeedbackFeed
          items={previewWorkspaceFeed()}
          isPreviewData
          emptyMessage="Nothing has been shared with everyone yet."
        />
      );
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
