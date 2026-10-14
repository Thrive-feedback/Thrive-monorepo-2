import { Suspense } from 'react';
import { previewWorkspaceFeed } from '@/app/(signed-in)/(member)/home/_lib/feed.mock';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/atoms/resizable';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import type { HomeTab } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { FeedbackComposerCard } from './feedback-composer-card';
import { FeedbackFeed } from './feedback-feed';
import styles from './home-split-view.module.css';
import { HomeTabs } from './home-tabs';

/** The Workspace feed has a column of its own here, so the tabs beside it are the person's. */
const PERSONAL_TABS = ['shared', 'my-requests', 'waiting'] as const;

export type HomeSplitViewProps = {
  tab: HomeTab;
  membership: CurrentMembership;
  ownEmail: string;
  className?: string;
};

/**
 * Home on a wide screen: the Workspace feed on the left under a welcome that stays put, the feed
 * passing beneath it blurred across the whole column; on the right, asking for or giving
 * Feedback, then the person's own activity in tabs. The line between them can be dragged; each
 * column scrolls on its own. The address `/home` names the Workspace feed, which is always open
 * here, so it opens Shared with me beside it.
 */
export function HomeSplitView({
  tab,
  membership,
  ownEmail,
  className,
}: HomeSplitViewProps) {
  return (
    <div className={cn(styles.split, className)}>
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          defaultSize="60%"
          minSize="40%"
          className={styles.column}
        >
          <div className="flex flex-col gap-6">
            <h1
              className={cn(
                'sticky top-0 z-10 flex flex-col pr-6 pb-4',
                styles.welcome,
              )}
            >
              <Text
                as="span"
                variant="subtitle-handwrite-1"
                className="text-action-secondary"
              >
                Welcome to
              </Text>{' '}
              <Text as="span" variant="display-3">
                {membership.workspace.name}
              </Text>
            </h1>
            <div className="pr-6">
              <FeedbackFeed
                items={previewWorkspaceFeed()}
                emptyMessage="Nothing has been shared with everyone yet."
              />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle hasGrip aria-label="Resize Workspace feed" />
        <ResizablePanel
          defaultSize="40%"
          minSize="30%"
          className={styles.column}
        >
          <div className="flex flex-col gap-6 pl-6">
            <Suspense fallback={<Skeleton shape="card" className="h-80" />}>
              <FeedbackComposerCard
                membership={membership}
                ownEmail={ownEmail}
              />
            </Suspense>
            <hr className="border-border-subtle" />
            <Text as="h2" variant="subtitle-handwrite-2">
              My Activity
            </Text>
            <HomeTabs
              tab={tab === 'workspace' ? 'shared' : tab}
              membership={membership}
              tabs={PERSONAL_TABS}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
