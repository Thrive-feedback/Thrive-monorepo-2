import NextLink from 'next/link';
import { Suspense } from 'react';
import {
  previewSharedWithMe,
  previewWorkspaceFeed,
} from '@/app/(signed-in)/(member)/home/_lib/feed.mock';
import { Button } from '@/components/atoms/button';
import { ButtonGroup } from '@/components/atoms/button-group';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import { HOME_TABS, type HomeTab, ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { FeedbackFeed } from './feedback-feed';
import styles from './home-tabs.module.css';
import { ReceivedFeedbackList } from './received-feedback-list';
import { SentRequestList } from './sent-request-list';
import { WaitingAskList } from './waiting-ask-list';

const TAB_NAMES: Readonly<Record<HomeTab, string>> = {
  workspace: 'Workspace feed',
  shared: 'Shared with me',
  'my-requests': 'My requests',
  waiting: 'Waiting for me',
  received: 'Feedback for me',
};

export type HomeTabsProps = {
  tab: HomeTab;
  membership: CurrentMembership;
  /** The tabs to offer, in order; all of them unless a page already shows one elsewhere. */
  tabs?: readonly HomeTab[];
};

/** Only the open tab is drawn, so only its data is read. */
function TabPanel({ tab, membership }: Omit<HomeTabsProps, 'tabs'>) {
  switch (tab) {
    case 'workspace':
      return (
        <FeedbackFeed
          items={previewWorkspaceFeed()}
          emptyMessage="Nothing has been shared with everyone yet."
        />
      );
    case 'shared':
      return (
        <FeedbackFeed
          items={previewSharedWithMe()}
          emptyMessage="Nobody has shared Feedback with you yet."
        />
      );
    case 'my-requests':
      return <SentRequestList membership={membership} />;
    case 'waiting':
      return <WaitingAskList membership={membership} />;
    case 'received':
      return <ReceivedFeedbackList membership={membership} />;
  }
}

/**
 * Home's feed, one tab at a time. The tab is in the URL, so it survives a reload, a shared link
 * and the way back from an Ask; each tab is a link in a group of buttons, and the open one is
 * the current page.
 *
 * The Suspense boundary is keyed by tab, so a tab that reads the API shows its skeleton while
 * it loads rather than the tab that was open before.
 */
export function HomeTabs({ tab, membership, tabs = HOME_TABS }: HomeTabsProps) {
  return (
    <div className="flex flex-col gap-4">
      <nav
        aria-label="Feedback"
        className={cn('overflow-x-auto', styles.scroller)}
      >
        <ButtonGroup>
          {tabs.map((value) => (
            <Button
              key={value}
              variant={value === tab ? 'primary' : 'secondary'}
              size="sm"
              asChild
            >
              <NextLink
                href={ROUTES.homeTab(value)}
                scroll={false}
                aria-current={value === tab ? 'page' : undefined}
              >
                {TAB_NAMES[value]}
              </NextLink>
            </Button>
          ))}
        </ButtonGroup>
      </nav>
      <Suspense key={tab} fallback={<Skeleton shape="card" className="h-40" />}>
        <TabPanel tab={tab} membership={membership} />
      </Suspense>
    </div>
  );
}
