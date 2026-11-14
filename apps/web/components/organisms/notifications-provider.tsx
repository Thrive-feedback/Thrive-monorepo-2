'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import type { BellNotification } from '@/lib/notifications/notification.type';
import {
  countUnreadNotifications,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications/notification-actions.service';
import {
  isDrawableKind,
  NOTIFICATION_LINES,
  type UnreadPlace,
} from '@/lib/notifications/notification-copy.constant';
import { NOTIFICATIONS_PAGE_SIZE } from '@/lib/notifications/notification-page.constant';

/**
 * How often the bell asks again while somebody is looking at the page. A minute is what the
 * product promises — the bell is not a chat window, and the alternative is a held connection this
 * stack has nowhere to put.
 */
const POLL_INTERVAL_MS = 60_000;

/**
 * `loading` is only ever "nothing to show yet", and `failed` is "could not read, with nothing to
 * fall back on": an empty bell and a bell that could not be read are different answers. Once
 * either has been answered, a poll happens behind what is on screen rather than emptying the
 * panel (#269), and a poll that fails changes nothing.
 */
export type NotificationsStatus = 'loading' | 'ready' | 'failed';

type NotificationsValue = {
  readonly status: NotificationsStatus;
  /** Every line read so far, newest first, of the kinds this build can draw. */
  readonly lines: readonly BellNotification[];
  /** How many are unread in all, as the API counts them, read or not yet read into `lines`. */
  readonly unreadCount: number;
  /** Whether there are older lines than `lines` holds, to be read by {@link loadMore}. */
  readonly hasMore: boolean;
  readonly isLoadingMore: boolean;
  /** Ask again now, as opening the bell does; what is on screen stays until the answer. */
  readonly refresh: () => void;
  /** Read the next page of older lines, as scrolling near the end of the panel does. */
  readonly loadMore: () => void;
  /** The line pressed counts as read at once, everywhere a count is drawn. */
  readonly markRead: (notification: BellNotification) => void;
  readonly markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

export type NotificationsProviderProps = {
  children: React.ReactNode;
};

/**
 * Only the kinds this bundle has a sentence for. The bundle drawing the line decides, not the
 * server that answered: an open tab can outlive a deploy and be sent a kind it never heard of,
 * and a line drawn without a sentence would take the page down.
 */
function drawable(
  items: readonly BellNotification[],
): readonly BellNotification[] {
  return items.filter((item) => isDrawableKind(item.type));
}

/** `older` after `newer`, leaving out what `newer` already holds, which keeps its own copy. */
function joined(
  newer: readonly BellNotification[],
  older: readonly BellNotification[],
): readonly BellNotification[] {
  const held = new Set(newer.map((line) => line.id));
  return [...newer, ...older.filter((line) => !held.has(line.id))];
}

/**
 * What the person has been told, read once for every place that shows it: the bell, its number,
 * and the counts beside Waiting for me and Received and their tabs. One poll feeds them all, so
 * reading a line in the bell takes every number down together, and nothing here needs an API of
 * its own.
 *
 * A poll reads the unread count and the newest page. Older pages are read only as the person
 * scrolls for them, and stay: a poll lays the newest page over them rather than starting again.
 * The bell's number is the API's count; the navigation's are counted from the lines read so far —
 * the newest page, and any older page the person has scrolled the bell to (design 0022 D19).
 *
 * It asks the server on a timer rather than being pushed to: the browser cannot reach the API, so
 * every read is a server action, and nothing in this stack can hold a connection open. A count can
 * be up to a minute old, which is what the product promises. Nothing is asked for while the tab is
 * hidden — a tab left open for a week should cost nothing — and it asks again the moment the tab
 * comes back.
 */
export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const [status, setStatus] = useState<NotificationsStatus>('loading');
  const [lines, setLines] = useState<readonly BellNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  /** How many lines there are in all, drawable or not, as the last answer counted them. */
  const [total, setTotal] = useState(0);
  /** How many pages are read. A poll rereads only the first, so this only grows. */
  const [pagesRead, setPagesRead] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, startMarkingAll] = useTransition();

  /**
   * Which poll may still paint. Only the newest may — a slow first answer must not overwrite a
   * fresher second one — and a mark makes every poll in flight stale: server actions are sent one
   * at a time, so a poll sent before the mark can be answered from before it, and would paint the
   * line just read as unread again.
   */
  const pollTurn = useRef(0);
  /** Whether a poll is on its way, so focus and the tab coming back together send one. */
  const isPolling = useRef(false);
  /** Whether a page of older lines is on its way, so a scroll sends one at a time. */
  const isReadingMore = useRef(false);
  /**
   * Bumped by marking everything read. A page of older lines asked for before it can be answered
   * from before it; everything it holds existed then, and so is read now.
   */
  const markedAllTurn = useRef(0);

  const poll = useCallback(() => {
    if (isPolling.current) {
      return;
    }
    isPolling.current = true;
    pollTurn.current += 1;
    const thisPoll = pollTurn.current;
    // Sent together, and answered one after the other: server actions queue.
    void Promise.all([
      countUnreadNotifications().catch(() => null),
      listMyNotifications(1).catch(() => null),
    ]).then(([count, page]) => {
      if (thisPoll !== pollTurn.current) {
        return;
      }
      isPolling.current = false;
      if (count !== null) {
        setUnreadCount(count);
      }
      if (page === null) {
        setStatus((current) => (current === 'loading' ? 'failed' : current));
        return;
      }
      setLines((current) => joined(drawable(page.items), current));
      setTotal(page.total);
      setStatus('ready');
    });
  }, []);

  const refresh = useCallback(() => {
    // Only a bell that could not be read shows the skeleton again; anything else asks behind what
    // is on screen, an empty bell included.
    setStatus((current) => (current === 'failed' ? 'loading' : current));
    poll();
  }, [poll]);

  useEffect(() => {
    const pollWhileSeen = () => {
      if (document.visibilityState === 'visible') {
        poll();
      }
    };
    pollWhileSeen();
    const timer = window.setInterval(pollWhileSeen, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', pollWhileSeen);
    window.addEventListener('focus', pollWhileSeen);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', pollWhileSeen);
      window.removeEventListener('focus', pollWhileSeen);
    };
  }, [poll]);

  const hasMore = pagesRead * NOTIFICATIONS_PAGE_SIZE < total;

  const loadMore = useCallback(() => {
    if (isReadingMore.current || !hasMore) {
      return;
    }
    isReadingMore.current = true;
    setIsLoadingMore(true);
    const nextPage = pagesRead + 1;
    const markedAllBefore = markedAllTurn.current;
    void listMyNotifications(nextPage)
      .catch(() => null)
      .then((page) => {
        isReadingMore.current = false;
        setIsLoadingMore(false);
        // A page that could not be read is asked for again by the next scroll.
        if (page === null) {
          return;
        }
        setPagesRead(nextPage);
        const older = drawable(page.items).map((item) =>
          markedAllBefore === markedAllTurn.current
            ? item
            : { ...item, isRead: true },
        );
        // New lines push older ones down a page while the person scrolls, so a page can repeat
        // lines already read; it cannot skip any. The copy on screen may have been read since.
        setLines((current) => joined(current, older));
        setTotal(page.total);
      });
  }, [hasMore, pagesRead]);

  const markRead = useCallback((notification: BellNotification) => {
    if (notification.isRead) {
      return;
    }
    pollTurn.current += 1;
    isPolling.current = false;
    setLines((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
    markNotificationRead(notification.id).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    startMarkingAll(async () => {
      if (!(await markAllNotificationsRead())) {
        return;
      }
      // A poll still on its way was answered from before this, so it is dropped; and asked again,
      // since a bell it was meant to answer — one reopened after it could not be read — waits on it.
      const droppedAPoll = isPolling.current;
      pollTurn.current += 1;
      isPolling.current = false;
      markedAllTurn.current += 1;
      setLines((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      if (droppedAPoll) {
        poll();
      }
    });
  }, [poll]);

  const value = useMemo(
    () => ({
      status,
      lines,
      unreadCount,
      hasMore,
      isLoadingMore,
      refresh,
      loadMore,
      markRead,
      markAllRead,
    }),
    [
      status,
      lines,
      unreadCount,
      hasMore,
      isLoadingMore,
      refresh,
      loadMore,
      markRead,
      markAllRead,
    ],
  );

  return <NotificationsContext value={value}>{children}</NotificationsContext>;
}

/** The bell's lines and what can be done with them. Only inside a {@link NotificationsProvider}. */
export function useNotifications(): NotificationsValue {
  const value = use(NotificationsContext);
  if (value === null) {
    throw new Error('useNotifications needs a NotificationsProvider above it.');
  }
  return value;
}

/**
 * How many unread lines, for the places in the navigation that say so: one count per place a line
 * is counted in (see `countedIn`), and Received, which adds up its chips.
 */
export type UnreadCounts = Readonly<Record<UnreadPlace, number>> & {
  readonly received: number;
};

const NO_LINES: readonly BellNotification[] = [];

/**
 * The unread counts the navigation draws, from the lines the bell has read. Each kind is counted
 * where its line leads; Feedback shared with the person opens on Home, so it is in the bell's
 * number and in no count here.
 *
 * Outside a {@link NotificationsProvider} there is nothing to count, and every count is 0, so the
 * navigation draws no number rather than failing where no bell is mounted, such as the showcase.
 */
export function useUnreadCounts(): UnreadCounts {
  const lines = use(NotificationsContext)?.lines ?? NO_LINES;
  return useMemo(() => {
    const counts: Record<UnreadPlace, number> = {
      waiting: 0,
      requests: 0,
      offered: 0,
      kudos: 0,
    };
    for (const line of lines) {
      const place = NOTIFICATION_LINES[line.type].countedIn;
      if (!line.isRead && place !== null) {
        counts[place] += 1;
      }
    }
    return {
      ...counts,
      received: counts.requests + counts.offered + counts.kudos,
    };
  }, [lines]);
}
