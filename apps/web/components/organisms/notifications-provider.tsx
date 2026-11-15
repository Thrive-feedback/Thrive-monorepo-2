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
import type {
  CountedPlace,
  PlaceCounts,
} from '@/lib/notifications/navigation-counts.type';
import type {
  BellNotification,
  BellRead,
} from '@/lib/notifications/notification.type';
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  readBell,
  markPlaceOpened as tellPlaceOpened,
} from '@/lib/notifications/notification-actions.service';
import {
  isDrawableKind,
  NOTIFICATION_LINES,
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

/** What changes the navigation's counts before the next poll says so. Never changes itself. */
type NavigationCountActions = {
  /**
   * A page with a count was opened: the bell lines that lead there are read at once, a list's
   * count of what is new goes to nothing — Waiting for me's stays, since only answering takes it
   * down — and the server is told.
   */
  readonly markPlaceOpened: (place: CountedPlace) => void;
  /**
   * Call just before an answer is sent; call what it returns once the answer has gone. Waiting for
   * me then counts one fewer at once — unless a poll sent after the answer has already counted it,
   * which would make it one fewer twice.
   */
  readonly startAnsweringAsk: () => () => void;
};

/** The bell's lines and its number, changed together so a mark counts what it marks. */
type Bell = {
  readonly lines: readonly BellNotification[];
  readonly unreadCount: number;
};

const NO_COUNTS: PlaceCounts = {
  waiting: 0,
  requests: 0,
  offered: 0,
  kudos: 0,
  shared: 0,
};

const EMPTY_BELL: Bell = { lines: [], unreadCount: 0 };

const NOTHING_READ: BellRead = { count: null, page: null, counts: null };

/** How many times each page has been opened, to tell a page of older lines it opened meanwhile. */
type OpenedTurns = Record<CountedPlace, number>;

const NONE_OPENED: OpenedTurns = {
  waiting: 0,
  requests: 0,
  offered: 0,
  kudos: 0,
  shared: 0,
};

/**
 * Three contexts, so a place re-renders only for what it draws: the bell for its lines, the
 * navigation for its counts — which change a few times a day, not on every poll — and the pages
 * that mark themselves opened for actions that never change.
 */
const NotificationsContext = createContext<NotificationsValue | null>(null);
const CountsContext = createContext<PlaceCounts>(NO_COUNTS);
const CountActionsContext = createContext<NavigationCountActions | null>(null);

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

/** Whether two reads of the counts say the same, so an unchanged poll keeps the same object. */
function sameCounts(a: PlaceCounts, b: PlaceCounts): boolean {
  return (
    a.waiting === b.waiting &&
    a.requests === b.requests &&
    a.offered === b.offered &&
    a.kudos === b.kudos &&
    a.shared === b.shared
  );
}

/**
 * What waits on the person, read on one timer for every place that shows it: the bell and its
 * number, the counts beside Waiting for me, Received and Home, and on Received's chips and Home's
 * Shared with me.
 *
 * A poll is one server action reading the unread count, the newest page of lines and the
 * navigation's counts together. Older pages are read only as the person scrolls for them, and
 * stay: a poll lays the newest page over them rather than starting again. The bell's number is the
 * API's unread count. The navigation's are read from the Asks, Feedback and Kudos themselves, not
 * from the bell (ADR 0091): reading a line leaves them as they were, answering an Ask takes Waiting
 * for me down, and opening a list — a kind of Received, or Shared with me — takes that list's down
 * and reads the bell lines that lead to it (ADR 0092).
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
  const [bell, setBell] = useState<Bell>(EMPTY_BELL);
  /** How many lines there are in all, drawable or not, as the last answer counted them. */
  const [total, setTotal] = useState(0);
  /** How many pages are read. A poll rereads only the first, so this only grows. */
  const [pagesRead, setPagesRead] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [counts, setCounts] = useState<PlaceCounts>(NO_COUNTS);
  const [, startMarkingAll] = useTransition();

  /**
   * Which poll may still paint. Only the newest may — a slow first answer must not overwrite a
   * fresher second one — and a mark makes every poll in flight stale: server actions are sent one
   * at a time, so a poll sent before the mark can be answered from before it, and would paint the
   * line just read as unread again.
   */
  const pollTurn = useRef(0);
  /** The newest poll whose counts were painted, which an answer compares itself against. */
  const countedTurn = useRef(0);
  /** Whether a poll is on its way, so focus and the tab coming back together send one. */
  const isPolling = useRef(false);
  /** Whether a page of older lines is on its way, so a scroll sends one at a time. */
  const isReadingMore = useRef(false);
  /**
   * Bumped by marking everything read. A page of older lines asked for before it can be answered
   * from before it; everything it holds existed then, and so is read now.
   */
  const markedAllTurn = useRef(0);
  /** Bumped per page as it opens, for the same reason as {@link markedAllTurn}, one kind at a time. */
  const openedTurns = useRef<OpenedTurns>({ ...NONE_OPENED });

  const poll = useCallback(() => {
    if (isPolling.current) {
      return;
    }
    isPolling.current = true;
    pollTurn.current += 1;
    const thisPoll = pollTurn.current;
    void readBell()
      .catch(() => NOTHING_READ)
      .then(({ count, page, counts: placeCounts }) => {
        if (thisPoll !== pollTurn.current) {
          return;
        }
        isPolling.current = false;
        if (placeCounts !== null) {
          countedTurn.current = thisPoll;
          setCounts((current) =>
            sameCounts(current, placeCounts) ? current : placeCounts,
          );
        }
        if (count !== null || page !== null) {
          setBell((current) => ({
            lines:
              page === null
                ? current.lines
                : joined(drawable(page.items), current.lines),
            unreadCount: count ?? current.unreadCount,
          }));
        }
        if (page === null) {
          setStatus((current) => (current === 'loading' ? 'failed' : current));
          return;
        }
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
    const openedBefore = { ...openedTurns.current };
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
        // Asked for before everything, or this kind's page, was marked read, so possibly answered
        // from before it: what it holds existed then, and so is read now.
        const readSince = (item: BellNotification) => {
          const place = NOTIFICATION_LINES[item.type].readIn;
          return (
            markedAllBefore !== markedAllTurn.current ||
            openedBefore[place] !== openedTurns.current[place]
          );
        };
        const older = drawable(page.items).map((item) =>
          readSince(item) ? { ...item, isRead: true } : item,
        );
        // New lines push older ones down a page while the person scrolls, so a page can repeat
        // lines already read; it cannot skip any. The copy on screen may have been read since.
        setBell((current) => ({
          ...current,
          lines: joined(current.lines, older),
        }));
        setTotal(page.total);
      });
  }, [hasMore, pagesRead]);

  const markRead = useCallback((notification: BellNotification) => {
    if (notification.isRead) {
      return;
    }
    pollTurn.current += 1;
    isPolling.current = false;
    setBell((current) => ({
      lines: current.lines.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
      unreadCount: Math.max(0, current.unreadCount - 1),
    }));
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
      setBell((current) => ({
        lines: current.lines.map((item) => ({ ...item, isRead: true })),
        unreadCount: 0,
      }));
      if (droppedAPoll) {
        poll();
      }
    });
  }, [poll]);

  /**
   * A poll on its way may have been answered from before a change to the counts, and would undo
   * it, so it is dropped — and asked again, sent after the change, because the bell may be waiting
   * on it: a page opened on one list marks it before the first poll has answered.
   */
  const askAgainAfter = useCallback(
    (change: () => void) => {
      const droppedAPoll = isPolling.current;
      pollTurn.current += 1;
      isPolling.current = false;
      change();
      if (droppedAPoll) {
        poll();
      }
    },
    [poll],
  );

  const markPlaceOpened = useCallback(
    (place: CountedPlace) => {
      askAgainAfter(() => {
        openedTurns.current[place] += 1;
        if (place !== 'waiting') {
          setCounts((current) =>
            current[place] === 0 ? current : { ...current, [place]: 0 },
          );
        }
        // Lines not read into the bell yet are not here to count; the next poll brings the number
        // right.
        setBell((current) => {
          const leadsHere = (line: BellNotification) =>
            !line.isRead && NOTIFICATION_LINES[line.type].readIn === place;
          const newlyRead = current.lines.filter(leadsHere).length;
          if (newlyRead === 0) {
            return current;
          }
          return {
            lines: current.lines.map((line) =>
              leadsHere(line) ? { ...line, isRead: true } : line,
            ),
            unreadCount: Math.max(0, current.unreadCount - newlyRead),
          };
        });
        tellPlaceOpened(place).catch(() => {});
      });
    },
    [askAgainAfter],
  );

  const startAnsweringAsk = useCallback(() => {
    // Server actions are answered in the order they are sent, so a poll sent after this point is
    // read after the answer is stored, and already counts it.
    // A poll sent before it has always been answered by the time the answer has gone, so none is
    // left to undo this; one still on its way was sent after it, and paints the same number.
    const sentAfter = pollTurn.current;
    return () => {
      if (countedTurn.current > sentAfter) {
        return;
      }
      setCounts((current) =>
        current.waiting === 0
          ? current
          : { ...current, waiting: current.waiting - 1 },
      );
    };
  }, []);

  const value = useMemo(
    () => ({
      status,
      lines: bell.lines,
      unreadCount: bell.unreadCount,
      hasMore,
      isLoadingMore,
      refresh,
      loadMore,
      markRead,
      markAllRead,
    }),
    [
      status,
      bell,
      hasMore,
      isLoadingMore,
      refresh,
      loadMore,
      markRead,
      markAllRead,
    ],
  );

  const countActions = useMemo(
    () => ({ markPlaceOpened, startAnsweringAsk }),
    [markPlaceOpened, startAnsweringAsk],
  );

  return (
    <NotificationsContext value={value}>
      <CountsContext value={counts}>
        <CountActionsContext value={countActions}>
          {children}
        </CountActionsContext>
      </CountsContext>
    </NotificationsContext>
  );
}

/** The bell's lines and what can be done with them. Only inside a {@link NotificationsProvider}. */
export function useNotifications(): NotificationsValue {
  const value = use(NotificationsContext);
  if (value === null) {
    throw new Error('useNotifications needs a NotificationsProvider above it.');
  }
  return value;
}

/** The counts the navigation draws: one per place, and Received, which adds up its chips. */
export type NavigationCounts = PlaceCounts & {
  readonly received: number;
};

/**
 * The counts beside Waiting for me, Received, Received's chips and Shared with me.
 *
 * Outside a {@link NotificationsProvider} there is nothing to count, and every count is 0, so the
 * navigation draws no number rather than failing where no bell is mounted, such as the showcase.
 */
export function useNavigationCounts(): NavigationCounts {
  const counts = use(CountsContext);
  return useMemo(
    () => ({
      ...counts,
      received: counts.requests + counts.offered + counts.kudos,
    }),
    [counts],
  );
}

const NOTHING_TO_COUNT: NavigationCountActions = {
  markPlaceOpened: () => {},
  startAnsweringAsk: () => () => {},
};

/**
 * What changes the navigation's counts before the next poll does. Outside a
 * {@link NotificationsProvider} there is no count to change, so each does nothing.
 */
export function useNavigationCountActions(): NavigationCountActions {
  return use(CountActionsContext) ?? NOTHING_TO_COUNT;
}
