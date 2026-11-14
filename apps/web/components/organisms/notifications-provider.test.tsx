import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationsPage } from '@/lib/notifications/notification.type';
import {
  aBellNotification,
  answerTheBell,
  aPage,
  BELL_ACTIONS,
  settled,
  unreadLines,
} from '@/lib/test/bell-notifications';
import {
  NotificationsProvider,
  useNotifications,
  useUnreadCounts,
} from './notifications-provider';

vi.mock(
  '@/lib/notifications/notification-actions.service',
  async () => (await import('@/lib/test/bell-notifications')).BELL_ACTIONS,
);

const { listMyNotifications, markAllNotificationsRead } = BELL_ACTIONS;

/** Says every count aloud, and offers what the bell offers: reading one, all, and more. */
function Counts() {
  const counts = useUnreadCounts();
  const { lines, unreadCount, hasMore, markRead, markAllRead, loadMore } =
    useNotifications();
  const firstUnread = lines.find((line) => !line.isRead);
  return (
    <>
      <output aria-label="counts">
        {`bell ${unreadCount}, waiting ${counts.waiting}, received ${counts.received}, requests ${counts.requests}, offered ${counts.offered}, kudos ${counts.kudos}`}
      </output>
      <output aria-label="lines">
        {`${lines.length} lines${hasMore ? ', more to read' : ''}`}
      </output>
      <button
        type="button"
        onClick={() => firstUnread && markRead(firstUnread)}
      >
        Read the first
      </button>
      <button type="button" onClick={markAllRead}>
        Read all
      </button>
      <button type="button" onClick={loadMore}>
        Read more
      </button>
    </>
  );
}

function draw() {
  render(
    <NotificationsProvider>
      <Counts />
    </NotificationsProvider>,
  );
}

function counts() {
  return screen.getByRole('status', { name: 'counts' });
}

function linesRead() {
  return screen.getByRole('status', { name: 'lines' });
}

function held<T>() {
  let give: (value: T) => void = () => {};
  const promise = new Promise<T>((resolve) => {
    give = resolve;
  });
  return { promise, give };
}

beforeEach(() => {
  answerTheBell();
});

describe('the unread counts the navigation draws', () => {
  it('counts each kind where the person reads it, from the bell’s own lines', async () => {
    answerTheBell([
      ...unreadLines('ASK_RECEIVED', 2),
      aBellNotification('ASK_ANSWERED'),
      aBellNotification('FEEDBACK_RECEIVED'),
      ...unreadLines('KUDOS_RECEIVED', 2),
      // Shared Feedback is read on Home, so it is in the bell's number and no Received count.
      aBellNotification('FEEDBACK_SHARED'),
      aBellNotification('KUDOS_RECEIVED', { isRead: true }),
    ]);

    draw();

    await waitFor(() =>
      expect(counts()).toHaveTextContent(
        'bell 7, waiting 2, received 4, requests 1, offered 1, kudos 2',
      ),
    );
  });

  it('takes the count of a line down the moment it is read, and only that one', async () => {
    const user = userEvent.setup();
    answerTheBell([
      aBellNotification('KUDOS_RECEIVED'),
      aBellNotification('ASK_RECEIVED'),
    ]);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('kudos 1'));

    await user.click(screen.getByRole('button', { name: 'Read the first' }));

    expect(counts()).toHaveTextContent(
      'bell 1, waiting 1, received 0, requests 0, offered 0, kudos 0',
    );
    expect(BELL_ACTIONS.markNotificationRead).toHaveBeenCalledOnce();
  });

  it('clears every count when everything is marked read', async () => {
    const user = userEvent.setup();
    answerTheBell([
      aBellNotification('ASK_RECEIVED'),
      aBellNotification('ASK_ANSWERED'),
    ]);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('bell 2'));

    await user.click(screen.getByRole('button', { name: 'Read all' }));

    await waitFor(() =>
      expect(counts()).toHaveTextContent(
        'bell 0, waiting 0, received 0, requests 0, offered 0, kudos 0',
      ),
    );
  });

  it('keeps every count when marking everything read is refused', async () => {
    const user = userEvent.setup();
    answerTheBell([aBellNotification('ASK_RECEIVED')]);
    markAllNotificationsRead.mockResolvedValue(false);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('waiting 1'));

    await user.click(screen.getByRole('button', { name: 'Read all' }));

    await waitFor(() =>
      expect(markAllNotificationsRead).toHaveBeenCalledOnce(),
    );
    expect(counts()).toHaveTextContent('bell 1, waiting 1');
  });

  it('keeps the counts it has when a later read fails', async () => {
    answerTheBell([aBellNotification('ASK_RECEIVED')]);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('waiting 1'));
    listMyNotifications.mockResolvedValue(null);
    BELL_ACTIONS.countUnreadNotifications.mockResolvedValue(null);

    await settled(() => window.dispatchEvent(new Event('focus')));

    expect(listMyNotifications).toHaveBeenCalledTimes(2);
    expect(counts()).toHaveTextContent('bell 1, waiting 1');
  });

  it('does not let a read answered from before a mark undo it', async () => {
    // Server actions are sent one at a time, so a poll sent before the mark can be answered from
    // before it, with the line still unread.
    const user = userEvent.setup();
    const line = aBellNotification('KUDOS_RECEIVED');
    answerTheBell([line]);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('kudos 1'));
    const stale = held<NotificationsPage | null>();
    listMyNotifications.mockReturnValue(stale.promise);
    window.dispatchEvent(new Event('focus'));

    await user.click(screen.getByRole('button', { name: 'Read the first' }));
    await settled(() => stale.give(aPage([line])));

    expect(counts()).toHaveTextContent('bell 0, waiting 0, received 0');
  });

  it('counts nothing outside a provider, so a place with no bell draws no number', () => {
    function Bare() {
      return <output aria-label="bare">{useUnreadCounts().received}</output>;
    }

    render(<Bare />);

    expect(screen.getByRole('status', { name: 'bare' })).toHaveTextContent('0');
    expect(listMyNotifications).not.toHaveBeenCalled();
  });
});

describe('reading older lines', () => {
  it('reads the next page on request, adds it after the lines it has, and stops at the last', async () => {
    const user = userEvent.setup();
    const firstPage = unreadLines('ASK_RECEIVED', 100);
    const secondPage = unreadLines('KUDOS_RECEIVED', 20);
    listMyNotifications.mockImplementation(async (page = 1) =>
      aPage(page === 1 ? firstPage : secondPage, 120),
    );
    draw();
    await waitFor(() =>
      expect(linesRead()).toHaveTextContent('100 lines, more to read'),
    );

    await user.click(screen.getByRole('button', { name: 'Read more' }));

    await waitFor(() => expect(linesRead()).toHaveTextContent('120 lines'));
    expect(linesRead()).not.toHaveTextContent('more to read');
    // Counted from every line read, the older ones too.
    expect(counts()).toHaveTextContent('waiting 100, received 20');
    await user.click(screen.getByRole('button', { name: 'Read more' }));
    expect(listMyNotifications).toHaveBeenCalledTimes(2);
  });

  it('keeps the older lines it has read when a poll brings the newest page again', async () => {
    const user = userEvent.setup();
    const firstPage = unreadLines('ASK_RECEIVED', 100);
    const older = aBellNotification('KUDOS_RECEIVED');
    listMyNotifications.mockImplementation(async (page = 1) =>
      aPage(page === 1 ? firstPage : [older], 101),
    );
    draw();
    await waitFor(() => expect(linesRead()).toHaveTextContent('100 lines'));
    await user.click(screen.getByRole('button', { name: 'Read more' }));
    await waitFor(() => expect(linesRead()).toHaveTextContent('101 lines'));

    // Something new arrives: it is first, and nothing read before is lost or repeated.
    const newest = aBellNotification('ASK_ANSWERED');
    listMyNotifications.mockResolvedValue(
      aPage([newest, ...firstPage.slice(0, 99)], 102),
    );
    window.dispatchEvent(new Event('focus'));

    await waitFor(() => expect(linesRead()).toHaveTextContent('102 lines'));
    expect(counts()).toHaveTextContent('requests 1, offered 0, kudos 1');
  });

  it('reads a page asked for before Mark all as read as read', async () => {
    const user = userEvent.setup();
    const secondPage = held<NotificationsPage | null>();
    listMyNotifications.mockImplementation((page = 1) =>
      page === 1
        ? Promise.resolve(aPage(unreadLines('ASK_RECEIVED', 100), 101))
        : secondPage.promise,
    );
    draw();
    await waitFor(() => expect(linesRead()).toHaveTextContent('100 lines'));

    await user.click(screen.getByRole('button', { name: 'Read more' }));
    await user.click(screen.getByRole('button', { name: 'Read all' }));
    await waitFor(() => expect(counts()).toHaveTextContent('waiting 0'));
    secondPage.give(aPage([aBellNotification('KUDOS_RECEIVED')], 101));

    await waitFor(() => expect(linesRead()).toHaveTextContent('101 lines'));
    expect(counts()).toHaveTextContent('waiting 0, received 0');
  });

  it('asks again for an older page that could not be read, the next time it is wanted', async () => {
    const user = userEvent.setup();
    const older = aBellNotification('KUDOS_RECEIVED');
    let secondPageAnswers = 0;
    listMyNotifications.mockImplementation(async (page = 1) => {
      if (page === 1) {
        return aPage(unreadLines('ASK_RECEIVED', 100), 101);
      }
      secondPageAnswers += 1;
      return secondPageAnswers === 1 ? null : aPage([older], 101);
    });
    draw();
    await waitFor(() => expect(linesRead()).toHaveTextContent('100 lines'));

    await user.click(screen.getByRole('button', { name: 'Read more' }));
    await settled();
    expect(linesRead()).toHaveTextContent('100 lines, more to read');

    await user.click(screen.getByRole('button', { name: 'Read more' }));
    await settled();
    expect(linesRead()).toHaveTextContent('101 lines');
    expect(secondPageAnswers).toBe(2);
  });

  it('takes a count down when a poll brings a line read somewhere else', async () => {
    const line = aBellNotification('ASK_RECEIVED');
    answerTheBell([line]);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('waiting 1'));

    // Read on the person's phone: the newest copy is the one kept.
    answerTheBell([{ ...line, isRead: true }]);
    await settled(() => window.dispatchEvent(new Event('focus')));

    expect(counts()).toHaveTextContent('bell 0, waiting 0');
  });

  it('keeps a line read on an older page read through the next poll', async () => {
    const user = userEvent.setup();
    const firstPage = Array.from({ length: 100 }, () =>
      aBellNotification('ASK_RECEIVED', { isRead: true }),
    );
    listMyNotifications.mockImplementation(async (page = 1) =>
      aPage(
        page === 1 ? firstPage : [aBellNotification('KUDOS_RECEIVED')],
        101,
      ),
    );
    draw();
    await waitFor(() => expect(linesRead()).toHaveTextContent('100 lines'));
    await user.click(screen.getByRole('button', { name: 'Read more' }));
    await waitFor(() => expect(counts()).toHaveTextContent('kudos 1'));

    await user.click(screen.getByRole('button', { name: 'Read the first' }));
    await settled(() => window.dispatchEvent(new Event('focus')));

    // Still there, and still read: not dropped by the poll.
    expect(linesRead()).toHaveTextContent('101 lines');
    expect(counts()).toHaveTextContent('kudos 0');
  });

  it('asks again after Mark all as read drops a poll that was on its way', async () => {
    // Dropped because it was answered from before the mark; asked again, so a bell reopened
    // after it could not be read is not left on its skeleton until the next minute.
    const user = userEvent.setup();
    answerTheBell([aBellNotification('ASK_RECEIVED')]);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('waiting 1'));
    const stale = held<NotificationsPage | null>();
    listMyNotifications.mockReturnValueOnce(stale.promise);
    window.dispatchEvent(new Event('focus'));

    await user.click(screen.getByRole('button', { name: 'Read all' }));
    await settled(() => stale.give(aPage([])));

    expect(listMyNotifications).toHaveBeenCalledTimes(3);
  });
});
