'use client';

import {
  ClockIcon,
  EllipsisIcon,
  HandHeartIcon,
  HouseIcon,
  InboxIcon,
  type LucideIcon,
  SendIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { SHARED_COUNT_SAID } from '@/app/(signed-in)/(sidebar)/_lib/shared-count-said.constant';
import { CountBadge, CountSaid } from '@/components/atoms/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import glass from '@/components/organisms/glass.module.css';
import { useNavigationCounts } from '@/components/organisms/notifications-provider';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import styles from './tab-bar.module.css';

export type TabBarProps = {
  /** Whether More offers Your dashboard, as the sidebar does (ADR 0087). */
  showsDashboard: boolean;
  /** "+", in the middle of the bar. */
  children: React.ReactNode;
};

/** A tab's icon and its word under it; the current one is plum, its icon on the plum tint. */
const TAB_CLASSES =
  'group flex w-full flex-col items-center gap-1 rounded-button py-1.5 text-button-xs text-fg-secondary aria-[current]:text-action-primary data-[state=open]:text-fg-primary';
/** A tab's count, on its icon's corner, lifted off the bar. */
const TAB_COUNT_CLASSES = 'absolute -top-1.5 right-0 shadow-low';
const TAB_ICON_CLASSES =
  'relative flex h-7 w-12 items-center justify-center rounded-full transition-colors group-aria-[current]:bg-action-primary-surface-hover motion-reduce:transition-none';

/**
 * The phone's way around, in place of the sidebar it has no room for: Home, the Kudos board, "+"
 * in the middle, Waiting for me with its count, and More, which opens the rest of the sidebar:
 * Teammates, then My Feedback's Your dashboard, Received and Given, as the sidebar groups them.
 *
 * It is the frame's bottom strip grown tall enough to hold them, the same frosted glass, curving
 * into the page at both ends as the navbar does at the top. It reads the path itself because the
 * layout around it does not run again when the client navigates between the pages under it.
 */
export function TabBar({ showsDashboard, children }: TabBarProps) {
  const pathname = usePathname();
  const counts = useNavigationCounts();
  const inMore = [
    ROUTES.teammates,
    ...(showsDashboard ? [ROUTES.dashboard] : []),
    ROUTES.received,
    ROUTES.given,
  ].some((href) => pathname.startsWith(href));

  return (
    <div
      data-slot="tab-bar"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 md:hidden',
        glass.glass,
        glass.curvesUp,
        glass.framed,
        styles.tabBar,
      )}
    >
      <nav aria-label="Main">
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
          <li>
            <Tab
              href={ROUTES.home}
              Icon={HouseIcon}
              currentHref={pathname}
              label="Home"
              count={counts.shared}
              countSaid={SHARED_COUNT_SAID}
            />
          </li>
          <li>
            <Tab
              href={ROUTES.kudos}
              Icon={HandHeartIcon}
              currentHref={pathname}
              label="Kudos"
              rest=" board"
            />
          </li>
          <li className="flex justify-center">{children}</li>
          <li>
            <Tab
              href={ROUTES.waiting}
              Icon={ClockIcon}
              currentHref={pathname}
              label="Waiting"
              rest=" for me"
              count={counts.waiting}
            />
          </li>
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-current={inMore ? 'page' : undefined}
                className={TAB_CLASSES}
              >
                <span className={TAB_ICON_CLASSES}>
                  <EllipsisIcon aria-hidden="true" className="size-5" />
                  {/* Received is inside More, so its count shows on More until it is opened. */}
                  <CountBadge
                    count={counts.received}
                    said={null}
                    className={TAB_COUNT_CLASSES}
                  />
                </span>
                <span>
                  More
                  <CountSaid
                    count={counts.received}
                    said="unread in Received"
                  />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56">
                <MoreLink
                  href={ROUTES.teammates}
                  Icon={UsersIcon}
                  label="Teammates"
                  isCurrent={pathname.startsWith(ROUTES.teammates)}
                />
                <DropdownMenuSeparator />
                <DropdownMenuLabel>My Feedback</DropdownMenuLabel>
                {showsDashboard && (
                  <MoreLink
                    href={ROUTES.dashboard}
                    Icon={SparklesIcon}
                    label="Your dashboard"
                    isCurrent={pathname.startsWith(ROUTES.dashboard)}
                  />
                )}
                <MoreLink
                  href={ROUTES.received}
                  Icon={InboxIcon}
                  label="Received"
                  isCurrent={pathname.startsWith(ROUTES.received)}
                  count={counts.received}
                />
                <MoreLink
                  href={ROUTES.given}
                  Icon={SendIcon}
                  label="Given"
                  isCurrent={pathname.startsWith(ROUTES.given)}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </nav>
    </div>
  );
}

/**
 * A tab leading to a page. Its word is short to fit the bar; `rest` finishes its name for assistive
 * technology, so it is named as the sidebar names it.
 */
function Tab({
  href,
  Icon,
  currentHref,
  label,
  rest,
  count,
  countSaid,
}: {
  href: string;
  Icon: LucideIcon;
  currentHref: string;
  label: string;
  rest?: string;
  count?: number;
  /** What the count is, said after the number, where the tab's name does not say it. */
  countSaid?: string;
}) {
  return (
    <NextLink
      href={href}
      aria-current={href === currentHref ? 'page' : undefined}
      className={TAB_CLASSES}
    >
      <span className={TAB_ICON_CLASSES}>
        <Icon aria-hidden="true" className="size-5" />
        {/* Drawn on the icon's corner, its words read after the name, as the sidebar reads it. */}
        <CountBadge
          count={count ?? 0}
          said={null}
          className={TAB_COUNT_CLASSES}
        />
      </span>
      <span>
        {label}
        {rest && <span className="sr-only">{rest}</span>}
        <CountSaid count={count ?? 0} said={countSaid} />
      </span>
    </NextLink>
  );
}

/** A page in More's menu, marked when it is the page open, with its unread count if it has one. */
function MoreLink({
  href,
  Icon,
  label,
  isCurrent,
  count,
}: {
  href: string;
  Icon: LucideIcon;
  label: string;
  isCurrent: boolean;
  count?: number;
}) {
  return (
    // The open page stays plum when pointed at, rather than taking the menu's grey highlight.
    <DropdownMenuItem
      asChild
      className="aria-[current]:bg-action-primary-surface aria-[current]:text-action-primary aria-[current]:data-highlighted:bg-action-primary-surface"
    >
      <NextLink href={href} aria-current={isCurrent ? 'page' : undefined}>
        <Icon aria-hidden="true" className="size-4.5" />
        <span className="flex-1">{label}</span>
        <CountBadge count={count ?? 0} />
      </NextLink>
    </DropdownMenuItem>
  );
}
