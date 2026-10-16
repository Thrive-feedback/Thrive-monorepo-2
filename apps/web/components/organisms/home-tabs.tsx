import NextLink from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/atoms/button';
import { ButtonGroup } from '@/components/atoms/button-group';
import { Skeleton } from '@/components/atoms/skeleton';
import { cn } from '@/lib/cn.util';
import type { NavTarget } from '@/lib/navigation/nav-target.type';
import { HOME_TABS, type HomeTab } from '@/lib/routes.constant';
import styles from './home-tabs.module.css';

const TAB_NAMES: Readonly<Record<HomeTab, string>> = {
  workspace: 'Workspace feed',
  shared: 'Shared with me',
  'my-requests': 'My requests',
  waiting: 'Waiting for me',
  received: 'Feedback for me',
};

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
 * Home's feed, one tab at a time, in a group of buttons. On Home each tab is a link and the tab is
 * in the URL, so it survives a reload, a shared link and the way back from an Ask; the open one
 * is the current page. Given callbacks instead, each tab is a button and the open one is pressed.
 *
 * The Suspense boundary is keyed by tab, so a tab that reads the API shows its skeleton while
 * it loads rather than the tab that was open before.
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
        className={cn('overflow-x-auto', styles.scroller)}
      >
        <ButtonGroup>
          {tabs.map((value) => {
            const target = targetFor(value);
            const isOpen = value === tab;
            const variant = isOpen ? 'primary' : 'secondary';
            return 'href' in target ? (
              <Button key={value} variant={variant} size="sm" asChild>
                <NextLink
                  href={target.href}
                  scroll={false}
                  aria-current={isOpen ? 'page' : undefined}
                >
                  {TAB_NAMES[value]}
                </NextLink>
              </Button>
            ) : (
              <Button
                key={value}
                variant={variant}
                size="sm"
                aria-pressed={isOpen}
                onClick={target.onSelect}
              >
                {TAB_NAMES[value]}
              </Button>
            );
          })}
        </ButtonGroup>
      </nav>
      <Suspense key={tab} fallback={<Skeleton shape="card" className="h-40" />}>
        {children}
      </Suspense>
    </div>
  );
}
