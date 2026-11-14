'use client';

import { BellIcon } from 'lucide-react';
import { useId } from 'react';
import { CountBadge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { SkeletonRegion } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';
import styles from './notification-bell.module.css';
import { NotificationRow, NotificationRowSkeleton } from './notification-row';
import { NotificationsEmpty } from './notifications-empty';
import { useNotifications } from './notifications-provider';

/**
 * How close to the end of the lines, in pixels, scrolling asks for the next page: about four lines,
 * so the next page is usually there before the person reaches the end.
 */
const READ_MORE_WITHIN_PX = 240;

/**
 * How far the panel keeps from the window's edge: the width of the frame's glass strips (`w-3`,
 * `--frame-gap` in `glass.module.css`), so it ends inside the frame. Radix takes only a number here.
 */
const CLEAR_OF_THE_FRAME_PX = 12;

/** Enough rows to fill the panel while the real ones are on their way. */
const PLACEHOLDER_ROWS = ['first', 'second', 'third'] as const;

const COULD_NOT_LOAD =
  "We couldn't load these just now. Try again in a moment.";

function bellLabel(unreadCount: number): string {
  return unreadCount === 0
    ? 'Notifications'
    : `Notifications, ${unreadCount} unread`;
}

/**
 * The bell in the Member navbar: how many things are waiting to be read, and a panel of what the
 * person has been told, newest first, no taller than the window and scrolling inside. It reads
 * older lines as the person scrolls near the end. Pressing a line marks it read and opens what it
 * points at.
 *
 * What it shows is read by the {@link NotificationsProvider} above it, which also feeds the counts
 * in the navigation, so a line read here takes every number down together. Opening the bell asks
 * again at once; the lines it already has stay on screen until the answer.
 */
export function NotificationBell() {
  const {
    status,
    lines,
    unreadCount,
    hasMore,
    isLoadingMore,
    refresh,
    loadMore,
    markRead,
    markAllRead,
  } = useNotifications();
  const headingId = useId();

  function handleOpenChange(isOpening: boolean) {
    if (isOpening) {
      refresh();
    }
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (
      hasMore &&
      scrollHeight - scrollTop - clientHeight < READ_MORE_WITHIN_PX
    ) {
      loadMore();
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={bellLabel(unreadCount)}
          className="relative text-fg-secondary"
        >
          <BellIcon aria-hidden="true" className="size-5" />
          {/* The button's name says the count, so the badge says nothing more. */}
          <CountBadge
            count={unreadCount}
            said={null}
            className="absolute -top-0.5 -right-0.5"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        collisionPadding={CLEAR_OF_THE_FRAME_PX}
        className={cn('flex w-88 flex-col', styles.panel)}
      >
        <div className="flex shrink-0 items-center justify-between gap-2">
          <DropdownMenuLabel id={headingId}>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <DropdownMenuItem
              className="w-auto px-2 py-1 text-fg-accent"
              onSelect={(event) => {
                // The lines stay on screen and read as already-seen, so the menu stays open.
                event.preventDefault();
                markAllRead();
              }}
            >
              Mark all as read
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator className="shrink-0" />
        {/* The lines scroll under the header, which stays put with Mark all as read in it. */}
        <DropdownMenuGroup
          aria-labelledby={headingId}
          className="-mx-1 -mb-1 min-h-0 overflow-y-auto px-1 pb-1"
          onScroll={handleScroll}
        >
          {status === 'loading' && (
            <SkeletonRegion>
              {PLACEHOLDER_ROWS.map((row) => (
                <NotificationRowSkeleton key={row} />
              ))}
            </SkeletonRegion>
          )}
          {status === 'failed' && (
            <Text variant="body-2" tone="muted" className="px-2 py-3">
              {COULD_NOT_LOAD}
            </Text>
          )}
          {status === 'ready' && lines.length === 0 && <NotificationsEmpty />}
          {status === 'ready' &&
            lines.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onOpen={markRead}
              />
            ))}
          {isLoadingMore && (
            <SkeletonRegion>
              <NotificationRowSkeleton />
            </SkeletonRegion>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
