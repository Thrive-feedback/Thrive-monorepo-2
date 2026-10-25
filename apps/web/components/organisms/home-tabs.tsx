import { cva } from 'class-variance-authority';
import NextLink from 'next/link';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { HOME_TABS, type HomeTab } from '@/lib/routes.constant';
import styles from './home-tabs.module.css';
import { OpenTabInView } from './open-tab-in-view';

const TAB_NAMES: Readonly<Record<HomeTab, string>> = {
  workspace: 'Workspace feed',
  shared: 'Shared with me',
  'my-requests': 'My requests',
  waiting: 'Waiting for me',
  received: 'Feedback for me',
};

/**
 * Each tab as the shared Tabs draw one: words, underlined while open. The underline sits on the
 * row's baseline rather than over it, because the row scrolls sideways and anything reaching past
 * its bottom edge would let it scroll up and down as well.
 */
const homeTab = cva(
  'inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap border-b-3 px-1 pb-2.5 text-button-sm',
  {
    variants: {
      open: {
        true: 'border-action-primary text-fg-primary',
        false: 'border-transparent text-fg-secondary hover:text-fg-primary',
      },
    },
  },
);

export type HomeTabsProps = {
  tab: HomeTab;
  /** The tabs to offer, in order; all of them unless a page already shows one elsewhere. */
  tabs?: readonly HomeTab[];
  /** Where each tab leads: its address on Home, or a callback where there is none. */
  targetFor: (tab: HomeTab) => NavTarget;
  /** The open tab's content. The caller draws only that one, so only its data is read. */
  children: React.ReactNode;
};

/**
 * Home's feed, one tab at a time, in a row of underlined tabs. On Home each tab is a link and the tab is
 * in the URL, so it survives a reload, a shared link and the way back from an Ask; the open one
 * is the current page. Given callbacks instead, each tab is a button and the open one is pressed.
 *
 * What the open tab holds is drawn as given; a tab that reads the API brings its own Suspense
 * boundary and skeleton.
 */
export function HomeTabs({
  tab,
  tabs = HOME_TABS,
  targetFor,
  children,
}: HomeTabsProps) {
  return (
    <div className="flex flex-col gap-4">
      <nav
        aria-label="Feedback"
        className={cn(
          'overflow-x-auto overflow-y-hidden border-border-subtle border-b',
          styles.scroller,
        )}
      >
        <div className="flex items-end gap-5">
          {tabs.map((value) => {
            const target = targetFor(value);
            const isOpen = value === tab;
            return 'href' in target ? (
              <NextLink
                key={value}
                href={target.href}
                scroll={false}
                aria-current={isOpen ? 'page' : undefined}
                className={homeTab({ open: isOpen })}
              >
                {TAB_NAMES[value]}
              </NextLink>
            ) : (
              <button
                key={value}
                type="button"
                aria-pressed={isOpen}
                onClick={target.onSelect}
                className={homeTab({ open: isOpen })}
              >
                {TAB_NAMES[value]}
              </button>
            );
          })}
          <OpenTabInView key={tab} />
        </div>
      </nav>
      {children}
    </div>
  );
}

/**
 * `HomeTabs` still loading, for a page that does not yet know which tab is open: the row of
 * tabs as one line on its baseline, and the panel it is given.
 */
export function HomeTabsSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="border-border-subtle border-b pb-2.5">
        <Skeleton className="w-3/4 text-button-sm" />
      </div>
      {children}
    </div>
  );
}
