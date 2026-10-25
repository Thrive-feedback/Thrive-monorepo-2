import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/atoms/resizable';
import { Skeleton } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { FeedbackComposerSkeleton } from '@/components/organisms/feedback-composer';
import { FeedbackFeedSkeleton } from '@/components/organisms/feedback-feed';
import { HomeTabs, HomeTabsSkeleton } from '@/components/organisms/home-tabs';
import { WaitingAskListViewSkeleton } from '@/components/organisms/waiting-ask-list-view';
import { cn } from '@/lib/cn.util';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import type { HomeTab } from '@/lib/routes.constant';
import styles from './home-view.module.css';

/**
 * What is waiting on the person sits above the tabs, always in view, so the tabs hold history:
 * what was written to them, what they asked, and what others shared with them. The Workspace feed
 * has a column of its own in the split, so only the narrow column offers it as a tab.
 */
const PERSONAL_TABS = ['received', 'my-requests', 'shared'] as const;
const NARROW_TABS = ['workspace', ...PERSONAL_TABS] as const;

type HeadingLevel = 'h2' | 'h3';

export type HomeViewProps = {
  workspaceName: string;
  /** 1 on Home itself; 2 where Home is drawn inside a page that already has its `h1`. */
  headingLevel?: 1 | 2;
  /** Asking for Feedback or giving it. Drawn in both layouts, of which CSS shows one. */
  composer: React.ReactNode;
  /** Anything waiting for the person, above asking or giving; drawn in both layouts too. */
  notices?: React.ReactNode;
  /** The Workspace feed, for the split's own column. */
  workspaceFeed: React.ReactNode;
  /**
   * What is waiting on the person, above the tabs in both layouts, given the level its heading
   * takes on this page.
   */
  waitingFor: (headingAs: HeadingLevel) => React.ReactNode;
  tab: HomeTab;
  /** Where each tab leads: its address on Home, or a callback where there is none. */
  targetFor: (tab: HomeTab) => NavTarget;
  /** What a tab holds. Asked only for the tab that is open. */
  panelFor: (tab: HomeTab) => React.ReactNode;
  /** Gives the split its height, which depends on what surrounds it. */
  splitClassName?: string;
};

/**
 * Home's page shape, for Home and for anything that shows it. On a narrow screen, one column:
 * the Workspace's name, asking for Feedback or giving it, then the feed and the person's own
 * requests and Asks, one tab at a time. On a wide screen, a split: the Workspace feed on the left
 * under a welcome that stays put, the feed passing beneath it blurred across the whole column;
 * on the right, asking or giving, then the person's activity in tabs. The line between them can
 * be dragged, and each column scrolls on its own.
 *
 * In both, what is waiting on the person comes before their history, always in view.
 *
 * Both layouts are drawn and CSS shows one, so nothing needs a script to choose. The address
 * `/home` names the Workspace feed, which the split always shows, so the split opens Feedback for
 * me beside it. `waiting` is no longer a tab: its address opens the default tab, with the list
 * it named in view above it.
 */
export function HomeView({
  workspaceName,
  headingLevel = 1,
  composer,
  notices,
  workspaceFeed,
  waitingFor,
  tab,
  targetFor,
  panelFor,
  splitClassName,
}: HomeViewProps) {
  const Title = headingLevel === 1 ? 'h1' : 'h2';
  const sectionHeadingLevel = headingLevel === 1 ? 'h2' : 'h3';
  const narrowTab = tab === 'waiting' ? 'workspace' : tab;
  const personalTab =
    tab === 'workspace' || tab === 'waiting' ? 'received' : tab;

  return (
    <HomeLayout
      sectionHeadingLevel={sectionHeadingLevel}
      title={
        <Text variant="display-5" as={Title}>
          {workspaceName}
        </Text>
      }
      welcome={
        <Title className="flex flex-col">
          <WelcomeTo />{' '}
          <Text as="span" variant="display-3">
            {workspaceName}
          </Text>
        </Title>
      }
      notices={notices}
      composer={composer}
      workspaceFeed={workspaceFeed}
      waiting={waitingFor(sectionHeadingLevel)}
      activity={
        <HomeTabs tab={narrowTab} tabs={NARROW_TABS} targetFor={targetFor}>
          {panelFor(narrowTab)}
        </HomeTabs>
      }
      personalActivity={
        <HomeTabs tab={personalTab} tabs={PERSONAL_TABS} targetFor={targetFor}>
          {panelFor(personalTab)}
        </HomeTabs>
      }
      splitClassName={splitClassName}
    />
  );
}

/**
 * `HomeView` while the page is still being built, in both layouts: the Workspace's name, the
 * composer, the feed and the tabs in grey, with the words that never change already in place.
 * Which tab is open is not known yet, so each column shows the feed its tabs open on.
 */
export function HomeViewSkeleton({
  splitClassName,
}: {
  /** Gives the split its height, as it does `HomeView`'s. */
  splitClassName?: string;
}) {
  return (
    <HomeLayout
      sectionHeadingLevel="h2"
      title={<Skeleton className="w-1/2 text-display-5" />}
      welcome={
        <div className="flex flex-col">
          <WelcomeTo />
          <Skeleton className="w-1/2 text-display-3" />
        </div>
      }
      composer={<FeedbackComposerSkeleton />}
      workspaceFeed={<FeedbackFeedSkeleton />}
      waiting={<WaitingAskListViewSkeleton />}
      activity={
        <HomeTabsSkeleton>
          <FeedbackFeedSkeleton />
        </HomeTabsSkeleton>
      }
      personalActivity={
        <HomeTabsSkeleton>
          <FeedbackFeedSkeleton />
        </HomeTabsSkeleton>
      }
      splitClassName={splitClassName}
    />
  );
}

function WelcomeTo() {
  return (
    <Text
      as="span"
      variant="subtitle-handwrite-1"
      className="text-action-secondary-hover"
    >
      Welcome to
    </Text>
  );
}

type HomeLayoutProps = {
  sectionHeadingLevel: HeadingLevel;
  /** The Workspace's name atop the narrow column. */
  title: React.ReactNode;
  /** The welcome that stays atop the split's feed column. */
  welcome: React.ReactNode;
  notices?: React.ReactNode;
  composer: React.ReactNode;
  workspaceFeed: React.ReactNode;
  /** What is waiting on the person, between the composer and the tabs. */
  waiting: React.ReactNode;
  /** Every tab, under the composer in the narrow column. */
  activity: React.ReactNode;
  /** The person's own tabs, in the split's right column. */
  personalActivity: React.ReactNode;
  splitClassName?: string;
};

/** Where each part of Home sits in each layout, shared by Home and its skeleton. */
function HomeLayout({
  sectionHeadingLevel,
  title,
  welcome,
  notices,
  composer,
  workspaceFeed,
  waiting,
  activity,
  personalActivity,
  splitClassName,
}: HomeLayoutProps) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 lg:hidden">
        {title}
        {notices}
        {composer}
        {waiting}
        {activity}
      </div>
      <div className={cn('hidden lg:block', splitClassName)}>
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            defaultSize="60%"
            minSize="40%"
            className={styles.column}
          >
            <div className="flex flex-col gap-6">
              <div
                className={cn('sticky top-0 z-10 pr-6 pb-4', styles.welcome)}
              >
                {welcome}
              </div>
              <div className="pr-6">{workspaceFeed}</div>
            </div>
          </ResizablePanel>
          <ResizableHandle hasGrip aria-label="Resize Workspace feed" />
          <ResizablePanel
            defaultSize="40%"
            minSize="30%"
            className={styles.column}
          >
            <div className="flex flex-col gap-6 pl-6">
              {notices}
              <Text as={sectionHeadingLevel} variant="subtitle-3" tone="muted">
                Feedback
              </Text>
              {composer}
              <div className="mt-6">{waiting}</div>
              <Text
                as={sectionHeadingLevel}
                variant="subtitle-3"
                tone="muted"
                className="mt-6"
              >
                My Activity
              </Text>
              {personalActivity}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
