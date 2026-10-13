import NextLink from 'next/link';
import { Suspense } from 'react';
import {
  previewSharedWithMe,
  previewWorkspaceFeed,
} from '@/app/(signed-in)/(member)/home/_lib/feed.mock';
import { Skeleton } from '@/components/atoms/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/atoms/tabs';
import { HOME_TABS, type HomeTab, ROUTES } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { FeedbackFeed } from './feedback-feed';
import { SentRequestList } from './sent-request-list';
import { WaitingAskList } from './waiting-ask-list';

const TAB_NAMES: Readonly<Record<HomeTab, string>> = {
  workspace: 'Workspace feed',
  shared: 'Shared with me',
  'my-requests': 'My requests',
  waiting: 'Waiting for me',
};

export type HomeTabsProps = {
  tab: HomeTab;
  membership: CurrentMembership;
};

/** Only the open tab is drawn, so only its data is read. */
function TabPanel({ tab, membership }: HomeTabsProps) {
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
  }
}

/**
 * Home's feed, one tab at a time. The tab is in the URL, so it survives a reload, a shared link
 * and the way back from an Ask; each tab is a link, and the arrow keys only move between them
 * (`activationMode="manual"`), so moving through the tabs never navigates by itself.
 *
 * The Suspense boundary is keyed by tab, so a tab that reads the API shows its skeleton while
 * it loads rather than the tab that was open before.
 */
export function HomeTabs({ tab, membership }: HomeTabsProps) {
  return (
    <Tabs value={tab} activationMode="manual">
      <TabsList aria-label="Feedback">
        {HOME_TABS.map((value) => (
          <TabsTrigger key={value} value={value} asChild>
            <NextLink href={ROUTES.homeTab(value)} scroll={false}>
              {TAB_NAMES[value]}
            </NextLink>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={tab}>
        <Suspense
          key={tab}
          fallback={<Skeleton shape="card" className="h-40" />}
        >
          <TabPanel tab={tab} membership={membership} />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
