'use client';

import {
  ClockIcon,
  HandHeartIcon,
  HouseIcon,
  InboxIcon,
  type LucideIcon,
  MessageSquareTextIcon,
  SendIcon,
} from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/atoms/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import glass from '@/components/organisms/glass.module.css';
import { cn } from '@/lib/cn.util';
import { ROUTES } from '@/lib/routes.constant';
import styles from './tab-bar.module.css';

export type TabBarProps = {
  /** How many Asks are waiting for the person, shown on Waiting as the sidebar shows it. */
  waitingCount: number;
  /** "+", in the middle of the bar. */
  children: React.ReactNode;
};

/** A tab's icon and its word under it; the current one is plum, its icon on the plum tint. */
const TAB_CLASSES =
  'group flex w-full flex-col items-center gap-1 rounded-button py-1.5 text-button-xs text-fg-secondary aria-[current]:text-action-primary data-[state=open]:text-fg-primary';
const TAB_ICON_CLASSES =
  'relative flex h-7 w-12 items-center justify-center rounded-full transition-colors group-aria-[current]:bg-action-primary-surface-hover motion-reduce:transition-none';

/**
 * The phone's way around, in place of the sidebar it has no room for: Home, the Kudos board, "+"
 * in the middle, Waiting for me with its count, and My Feedback, which opens Received and
 * Given as the sidebar groups them. The Teammates page is not built, so it has no tab.
 *
 * It is the frame's bottom strip grown tall enough to hold them, the same frosted glass, curving
 * into the page at both ends as the navbar does at the top. It reads the path itself because the
 * layout around it does not run again when the client navigates between the pages under it.
 */
export function TabBar({ waitingCount, children }: TabBarProps) {
  const pathname = usePathname();
  const inMyFeedback =
    pathname.startsWith(ROUTES.received) || pathname.startsWith(ROUTES.given);

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
              count={waitingCount}
            />
          </li>
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-current={inMyFeedback ? 'page' : undefined}
                className={TAB_CLASSES}
              >
                <span className={TAB_ICON_CLASSES}>
                  <MessageSquareTextIcon
                    aria-hidden="true"
                    className="size-5"
                  />
                </span>
                <span>
                  <span className="sr-only">My </span>Feedback
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56">
                <DropdownMenuLabel>My Feedback</DropdownMenuLabel>
                <FeedbackLink
                  href={ROUTES.received}
                  Icon={InboxIcon}
                  label="Received"
                  isCurrent={pathname.startsWith(ROUTES.received)}
                />
                <FeedbackLink
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
}: {
  href: string;
  Icon: LucideIcon;
  currentHref: string;
  label: string;
  rest?: string;
  count?: number;
}) {
  const hasCount = count !== undefined && count > 0;

  return (
    <NextLink
      href={href}
      aria-current={href === currentHref ? 'page' : undefined}
      className={TAB_CLASSES}
    >
      <span className={TAB_ICON_CLASSES}>
        <Icon aria-hidden="true" className="size-5" />
        {/* Drawn on the icon's corner, but read after the name, as the sidebar reads it. */}
        {hasCount && (
          <Badge
            aria-hidden="true"
            tone="brand"
            className="absolute -top-1.5 right-0 px-1.5 tabular-nums shadow-low"
          >
            {count}
          </Badge>
        )}
      </span>
      <span>
        {label}
        {rest && <span className="sr-only">{rest}</span>}
        {hasCount && <span className="sr-only"> {count}</span>}
      </span>
    </NextLink>
  );
}

/** Received or Given in My Feedback's menu, marked when it is the page open. */
function FeedbackLink({
  href,
  Icon,
  label,
  isCurrent,
}: {
  href: string;
  Icon: LucideIcon;
  label: string;
  isCurrent: boolean;
}) {
  return (
    <DropdownMenuItem
      asChild
      className="aria-[current]:bg-action-primary-surface aria-[current]:text-action-primary"
    >
      <NextLink href={href} aria-current={isCurrent ? 'page' : undefined}>
        <Icon aria-hidden="true" className="size-4.5" />
        {label}
      </NextLink>
    </DropdownMenuItem>
  );
}
