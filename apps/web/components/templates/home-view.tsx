import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/atoms/resizable';
import { Text } from '@/components/atoms/text';
import { HomeTabs } from '@/components/organisms/home-tabs';
import { cn } from '@/lib/cn.util';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import type { HomeTab } from '@/lib/routes.constant';
import styles from './home-view.module.css';

/** The Workspace feed has a column of its own in the split, so the tabs beside it are the person's. */
const PERSONAL_TABS = ['shared', 'my-requests', 'waiting', 'received'] as const;

export type HomeViewProps = {
  workspaceName: string;
  /** 1 on Home itself; 2 where Home is drawn inside a page that already has its `h1`. */
  headingLevel?: 1 | 2;
  /** Asking for Feedback or giving it. Drawn in both layouts, of which CSS shows one. */
  composer: React.ReactNode;
  /** The Workspace feed, for the split's own column. */
  workspaceFeed: React.ReactNode;
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
 * Both layouts are drawn and CSS shows one, so nothing needs a script to choose. The address
 * `/home` names the Workspace feed, which the split always shows, so the split opens Shared with
 * me beside it.
 */
export function HomeView({
  workspaceName,
  headingLevel = 1,
  composer,
  workspaceFeed,
  tab,
  targetFor,
  panelFor,
  splitClassName,
}: HomeViewProps) {
  const Title = headingLevel === 1 ? 'h1' : 'h2';
  const Section = headingLevel === 1 ? 'h2' : 'h3';
  const personalTab = tab === 'workspace' ? 'shared' : tab;

  return (
    <>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 lg:hidden">
        <Text variant="display-5" as={Title}>
          {workspaceName}
        </Text>
        {composer}
        <HomeTabs tab={tab} targetFor={targetFor}>
          {panelFor(tab)}
        </HomeTabs>
      </div>
      <div className={cn('hidden lg:block', splitClassName)}>
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            defaultSize="60%"
            minSize="40%"
            className={styles.column}
          >
            <div className="flex flex-col gap-6">
              <Title
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
                  {workspaceName}
                </Text>
              </Title>
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
              <Text
                as={Section}
                variant="subtitle-handwrite-1"
                className="text-action-secondary-fg"
              >
                Feedback
              </Text>
              {composer}
              <hr className="border-border-subtle" />
              <Text
                as={Section}
                variant="subtitle-handwrite-1"
                className="text-action-secondary-fg"
              >
                My Activity
              </Text>
              <HomeTabs
                tab={personalTab}
                tabs={PERSONAL_TABS}
                targetFor={targetFor}
              >
                {panelFor(personalTab)}
              </HomeTabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
