'use client';

import { BellIcon } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { SkeletonRegion } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import type { BellNotification } from '@/lib/notifications/notification.type';
import {
  countUnreadNotifications,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications/notification-actions.service';
import { NotificationRow, NotificationRowSkeleton } from './notification-row';

/**
 * How often the count is asked for again while somebody is looking at the page. A minute is
 * what the product promises — the bell is not a chat window, and the alternative is a held
 * connection this stack has nowhere to put.
 */
const POLL_INTERVAL_MS = 60_000;

/** Past this the number stops being read and starts being a shape, and it breaks the badge. */
const MOST_SHOWN = 99;

/** Enough rows to fill the panel while the real ones are on their way. */
const PLACEHOLDER_ROWS = ['first', 'second', 'third'] as const;

const NOTHING_YET =
  'Nothing yet. When somebody asks you for feedback, answers you, or writes to you, it shows up here.';

const COULD_NOT_LOAD =
  "We couldn't load these just now. Try again in a moment.";

/**
 * `loading` is only ever an open with nothing to show. Once the panel has lines they are almost
 * always still right, so it shows them and refreshes behind rather than emptying itself and
 * making somebody wait again for what they are already reading (#269).
 */
type PanelState = 'loading' | 'ready' | 'failed';

function bellLabel(unreadCount: number): string {
  return unreadCount === 0
    ? 'Notifications'
    : `Notifications, ${unreadCount} unread`;
}

/**
 * The bell in the Member navbar: how many things are waiting to be read, and a panel of the most
 * recent, newest first. Pressing a line marks it read and opens what it points at.
 *
 * It asks the server, on a timer, rather than being pushed to: the browser cannot reach the API
 * at all, so every one of these goes through a server action, and there is nothing in this stack
 * that can hold a connection open. The price is that a count can be up to a minute old, which is
 * what the product promises. Nothing is asked for while the tab is hidden — a tab left open for a
 * week should cost nothing — and the count is asked for again the moment it comes back.
 *
 * A poll that fails changes nothing on screen. A bell is not worth an error banner, and the
 * number it is already showing is the best answer anybody has.
 */
export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<
    readonly BellNotification[]
  >([]);
  const [panelState, setPanelState] = useState<PanelState>('loading');
  const [, startMarkingAll] = useTransition();
  /**
   * Which open each answer belongs to. Somebody who opens the bell twice in quick succession has
   * two reads in flight, and only the newest may paint — otherwise a slow first answer overwrites
   * a fresher second one, or reports a failure about a request they have forgotten about.
   */
  const latestOpen = useRef(0);
  /**
   * How many lines are on screen, readable from an answer that arrives later. The panel state
   * cannot stand in for this: a successful read of an empty bell is `ready` with nothing in it,
   * and a refresh that then fails has to say so rather than keep claiming there is nothing yet.
   */
  const linesOnScreen = useRef(0);

  useEffect(() => {
    let isCurrent = true;

    const refreshCount = async () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      const count = await countUnreadNotifications();
      if (isCurrent && count !== null) {
        setUnreadCount(count);
      }
    };

    void refreshCount();
    const timer = window.setInterval(() => {
      void refreshCount();
    }, POLL_INTERVAL_MS);
    const handleBack = () => {
      void refreshCount();
    };
    document.addEventListener('visibilitychange', handleBack);
    window.addEventListener('focus', handleBack);

    return () => {
      isCurrent = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleBack);
      window.removeEventListener('focus', handleBack);
    };
  }, []);

  function showLines(items: readonly BellNotification[]) {
    linesOnScreen.current = items.length;
    setNotifications(items);
    setPanelState('ready');
  }

  function handleOpenChange(isOpening: boolean) {
    if (!isOpening) {
      return;
    }
    latestOpen.current += 1;
    const open = latestOpen.current;
    // An open with lines already on it keeps them and refreshes behind, so reopening is instant.
    if (linesOnScreen.current === 0) {
      setPanelState('loading');
    }
    void listMyNotifications().then((items) => {
      if (open !== latestOpen.current) {
        return;
      }
      if (items === null) {
        // A refresh that failed is not worth replacing lines somebody is already reading. With
        // nothing to fall back on it is worth saying, because "nothing yet" means something else.
        if (linesOnScreen.current === 0) {
          setPanelState('failed');
        }
        return;
      }
      showLines(items);
    });
  }

  function handleOpen(notification: BellNotification) {
    if (notification.isRead) {
      return;
    }
    setUnreadCount((count) => Math.max(0, count - 1));
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );
    void markNotificationRead(notification.id);
  }

  function handleMarkAllRead() {
    startMarkingAll(async () => {
      if (!(await markAllNotificationsRead())) {
        return;
      }
      setUnreadCount(0);
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
    });
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
          {unreadCount > 0 && (
            <Badge
              tone="brand"
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 px-1.5"
            >
              {unreadCount > MOST_SHOWN ? `${MOST_SHOWN}+` : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-88">
        <div className="flex items-center justify-between gap-2">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <DropdownMenuItem
              className="w-auto px-2 py-1 text-fg-accent"
              onSelect={(event) => {
                // The lines stay on screen and read as already-seen, so the menu stays open.
                event.preventDefault();
                handleMarkAllRead();
              }}
            >
              Mark all as read
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator />
        {panelState === 'loading' && (
          <SkeletonRegion>
            {PLACEHOLDER_ROWS.map((row) => (
              <NotificationRowSkeleton key={row} />
            ))}
          </SkeletonRegion>
        )}
        {panelState === 'failed' && (
          <Text variant="body-2" tone="muted" className="px-2 py-3">
            {COULD_NOT_LOAD}
          </Text>
        )}
        {panelState === 'ready' && notifications.length === 0 && (
          <Text variant="body-2" tone="muted" className="px-2 py-3">
            {NOTHING_YET}
          </Text>
        )}
        {panelState === 'ready' &&
          notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onOpen={handleOpen}
            />
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
