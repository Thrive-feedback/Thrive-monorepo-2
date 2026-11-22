'use client';

import { BellIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { CountBadge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/atoms/drawer';
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
import { MD_AND_UP } from '@/lib/breakpoint.constant';
import { cn } from '@/lib/cn.util';
import type { BellNotification } from '@/lib/notifications/notification.type';
import { useMediaQuery } from '@/lib/use-media-query';
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

const NOTIFICATIONS = 'Notifications';

function bellLabel(unreadCount: number): string {
  return unreadCount === 0
    ? NOTIFICATIONS
    : `${NOTIFICATIONS}, ${unreadCount} unread`;
}

/**
 * The bell in the Member navbar: how many things are waiting to be read, and a panel of what the
 * person has been told, newest first, no taller than the window and scrolling inside. From `md` the
 * panel drops from the bell; on a phone it rises from the bottom as a sheet, as the phone's other
 * sheets do, and pressing a line puts it away. It reads
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
  const atMd = useMediaQuery(MD_AND_UP);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // The sheet is a phone's: reaching `md` puts it away for good, rather than hiding it until the
  // window narrows again.
  if (atMd && isSheetOpen) {
    setIsSheetOpen(false);
  }

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

  const bell = (
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
  );

  /** A line in the phone's sheet marks itself read, and the sheet goes as its page opens. */
  function openFromSheet(notification: BellNotification) {
    markRead(notification);
    setIsSheetOpen(false);
  }

  function linesAs(variant: 'menu' | 'drawer') {
    return (
      <>
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
              onOpen={variant === 'drawer' ? openFromSheet : markRead}
              variant={variant}
            />
          ))}
        {isLoadingMore && (
          <SkeletonRegion>
            <NotificationRowSkeleton />
          </SkeletonRegion>
        )}
      </>
    );
  }

  if (!atMd) {
    return (
      <Drawer
        open={isSheetOpen}
        onOpenChange={(isOpening) => {
          setIsSheetOpen(isOpening);
          handleOpenChange(isOpening);
        }}
      >
        <DrawerTrigger asChild>{bell}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{NOTIFICATIONS}</DrawerTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-fg-accent"
                onClick={markAllRead}
              >
                Mark all as read
              </Button>
            )}
          </DrawerHeader>
          {/* The lines scroll under the header, which stays put with Mark all as read in it. */}
          <div
            className="-mx-3 min-h-0 overflow-y-auto px-1"
            onScroll={handleScroll}
          >
            {linesAs('drawer')}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>{bell}</DropdownMenuTrigger>
      <DropdownMenuContent
        collisionPadding={CLEAR_OF_THE_FRAME_PX}
        className={cn('flex w-88 flex-col', styles.panel)}
      >
        <div className="flex shrink-0 items-center justify-between gap-2">
          <DropdownMenuLabel id={headingId}>{NOTIFICATIONS}</DropdownMenuLabel>
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
          {linesAs('menu')}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
