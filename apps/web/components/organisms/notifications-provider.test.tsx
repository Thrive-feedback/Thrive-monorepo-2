import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaceCounts } from '@/lib/notifications/navigation-counts.type';
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
  useNavigationCountActions,
  useNavigationCounts,
  useNotifications,
} from './notifications-provider';

vi.mock(
  '@/lib/notifications/notification-actions.service',
  async () => (await import('@/lib/test/bell-notifications')).BELL_ACTIONS,
);

const { listMyNotifications, markAllNotificationsRead, readMyCounts } =
  BELL_ACTIONS;

/**
 * Says every count aloud, and offers what the bell offers — reading one, all, and more — and what
 * changes the navigation's counts: opening Kudos, and sending an answer that later goes.
 */
function Counts() {
  const counts = useNavigationCounts();
  const { markPlaceOpened, startAnsweringAsk } = useNavigationCountActions();
  const answerHasGone = useRef<() => void>(() => {});
  const { lines, unreadCount, hasMore, markRead, markAllRead, loadMore } =
    useNotifications();
  const firstUnread = lines.find((line) => !line.isRead);
  return (
    <>
      <output aria-label="counts">
        {`bell ${unreadCount}, waiting ${counts.waiting}, received ${counts.received}, requests ${counts.requests}, offered ${counts.offered}, kudos ${counts.kudos}, shared ${counts.shared}`}
      </output>
      <output aria-label="lines">
        {`${lines.length} lines${hasMore ? ', more to read' : ''}`}
      </output>
      <output aria-label="unread lines">
        {lines.filter((line) => !line.isRead).length}
      </output>
      <button type="button" onClick={() => markPlaceOpened('kudos')}>
        Open Kudos
      </button>
      <button type="button" onClick={() => markPlaceOpened('shared')}>
        Open Shared with me
      </button>
      <button type="button" onClick={() => markPlaceOpened('waiting')}>
        Open Waiting for me
      </button>
      <button
        type="button"
        onClick={() => {
          answerHasGone.current = startAnsweringAsk();
        }}
      >
        Send an answer
      </button>
      <button type="button" onClick={() => answerHasGone.current()}>
        The answer has gone
      </button>
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

function unreadLinesRead() {
  return screen.getByRole('status', { name: 'unread lines' });
}

const SOME_OF_EACH: PlaceCounts = {
  waiting: 2,
  requests: 1,
  offered: 3,
  kudos: 4,
  shared: 5,
};

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

describe('the counts the navigation draws', () => {
  it('draws what the counts read says, not what the bell’s lines say', async () => {
    answerTheBell(
      [...unreadLines('ASK_RECEIVED', 5), aBellNotification('KUDOS_RECEIVED')],
      SOME_OF_EACH,
    );

    draw();

    await waitFor(() =>
      expect(counts()).toHaveTextContent(
        'bell 6, waiting 2, received 8, requests 1, offered 3, kudos 4, shared 5',
      ),
    );
  });

  it('leaves every count as it was when a line is read in the bell', async () => {
    const user = userEvent.setup();
    answerTheBell([aBellNotification('ASK_RECEIVED')], SOME_OF_EACH);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('bell 1'));

    await user.click(screen.getByRole('button', { name: 'Read the first' }));

    expect(counts()).toHaveTextContent(
      'bell 0, waiting 2, received 8, requests 1, offered 3, kudos 4',
    );
    expect(BELL_ACTIONS.markNotificationRead).toHaveBeenCalledOnce();
  });

  it('leaves every count as it was when everything is marked read', async () => {
    const user = userEvent.setup();
    answerTheBell(
      [aBellNotification('ASK_RECEIVED'), aBellNotification('ASK_ANSWERED')],
      SOME_OF_EACH,
    );
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('bell 2'));

    await user.click(screen.getByRole('button', { name: 'Read all' }));

    await waitFor(() => expect(counts()).toHaveTextContent('bell 0'));
    expect(counts()).toHaveTextContent(
      'waiting 2, received 8, requests 1, offered 3, kudos 4',
    );
  });

  it('keeps the bell’s number when marking everything read is refused', async () => {
    const user = userEvent.setup();
    answerTheBell([aBellNotification('ASK_RECEIVED')]);
    markAllNotificationsRead.mockResolvedValue(false);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('bell 1'));

    await user.click(screen.getByRole('button', { name: 'Read all' }));

    await waitFor(() =>
      expect(markAllNotificationsRead).toHaveBeenCalledOnce(),
    );
    expect(counts()).toHaveTextContent('bell 1');
  });

  it('keeps the counts it has when a later read fails', async () => {
    answerTheBell([aBellNotification('ASK_RECEIVED')], SOME_OF_EACH);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('waiting 2'));
    listMyNotifications.mockResolvedValue(null);
    BELL_ACTIONS.countUnreadNotifications.mockResolvedValue(null);
    readMyCounts.mockResolvedValue(null);

    await settled(() => window.dispatchEvent(new Event('focus')));

    expect(readMyCounts).toHaveBeenCalledTimes(2);
    expect(counts()).toHaveTextContent('bell 1, waiting 2, received 8');
  });

  it('does not let a read answered from before a mark undo it', async () => {
    // Server actions are sent one at a time, so a poll sent before the mark can be answered from
    // before it, with the line still unread.
    const user = userEvent.setup();
    const line = aBellNotification('KUDOS_RECEIVED');
    answerTheBell([line]);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('bell 1'));
    const stale = held<NotificationsPage | null>();
    listMyNotifications.mockReturnValue(stale.promise);
    window.dispatchEvent(new Event('focus'));

    await user.click(screen.getByRole('button', { name: 'Read the first' }));
    await settled(() => stale.give(aPage([line])));

    expect(counts()).toHaveTextContent('bell 0');
    expect(unreadLinesRead()).toHaveTextContent('0');
  });

  it('takes a kind of Received to nothing the moment it is opened, tells the server, and leaves the rest', async () => {
    const user = userEvent.setup();
    answerTheBell([], SOME_OF_EACH);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('kudos 4'));

    await user.click(screen.getByRole('button', { name: 'Open Kudos' }));

    expect(counts()).toHaveTextContent(
      'waiting 2, received 4, requests 1, offered 3, kudos 0',
    );
    expect(BELL_ACTIONS.markPlaceOpened).toHaveBeenCalledExactlyOnceWith(
      'kudos',
    );
  });

  it('takes Shared with me to nothing the moment it is opened, and leaves Received as it was', async () => {
    const user = userEvent.setup();
    answerTheBell([], SOME_OF_EACH);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('shared 5'));

    await user.click(
      screen.getByRole('button', { name: 'Open Shared with me' }),
    );

    expect(counts()).toHaveTextContent(
      'received 8, requests 1, offered 3, kudos 4, shared 0',
    );
    expect(BELL_ACTIONS.markPlaceOpened).toHaveBeenCalledExactlyOnceWith(
      'shared',
    );
  });

  it('reads the bell lines that lead to a page the moment it opens, and no others', async () => {
    const user = userEvent.setup();
    answerTheBell(
      [
        aBellNotification('KUDOS_RECEIVED'),
        aBellNotification('KUDOS_RECEIVED'),
        aBellNotification('ASK_RECEIVED'),
      ],
      SOME_OF_EACH,
    );
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('bell 3'));

    await user.click(screen.getByRole('button', { name: 'Open Kudos' }));

    expect(counts()).toHaveTextContent('bell 1');
    expect(unreadLinesRead()).toHaveTextContent('1');
  });

  it('reads the lines about being asked when Waiting for me opens, and keeps its count', async () => {
    const user = userEvent.setup();
    answerTheBell(
      [aBellNotification('ASK_RECEIVED'), aBellNotification('KUDOS_RECEIVED')],
      SOME_OF_EACH,
    );
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('bell 2'));

    await user.click(
      screen.getByRole('button', { name: 'Open Waiting for me' }),
    );

    expect(counts()).toHaveTextContent('bell 1, waiting 2');
    expect(unreadLinesRead()).toHaveTextContent('1');
    expect(BELL_ACTIONS.markPlaceOpened).toHaveBeenCalledExactlyOnceWith(
      'waiting',
    );
  });

  it('takes Waiting for me down by one the moment an answer has gone', async () => {
    const user = userEvent.setup();
    answerTheBell([], SOME_OF_EACH);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('waiting 2'));

    await user.click(screen.getByRole('button', { name: 'Send an answer' }));
    await user.click(
      screen.getByRole('button', { name: 'The answer has gone' }),
    );

    expect(counts()).toHaveTextContent('waiting 1, received 8');
  });

  it('takes Waiting for me down at once while a poll sent after the answer is still on its way', async () => {
    const user = userEvent.setup();
    answerTheBell([], SOME_OF_EACH);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('waiting 2'));
    await settled();

    await user.click(screen.getByRole('button', { name: 'Send an answer' }));
    const onItsWay = held<PlaceCounts | null>();
    readMyCounts.mockReturnValueOnce(onItsWay.promise);
    window.dispatchEvent(new Event('focus'));
    await user.click(
      screen.getByRole('button', { name: 'The answer has gone' }),
    );

    expect(counts()).toHaveTextContent('waiting 1');
    await settled(() => onItsWay.give({ ...SOME_OF_EACH, waiting: 1 }));
    expect(counts()).toHaveTextContent('waiting 1');
  });

  it('does not take Waiting for me down twice when a poll sent after the answer already counted it', async () => {
    // Server actions are answered in the order they are sent, so a poll sent while the answer was
    // on its way reads the Ask as answered. Taking one off again would show one fewer than waits.
    const user = userEvent.setup();
    answerTheBell([], SOME_OF_EACH);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('waiting 2'));

    await user.click(screen.getByRole('button', { name: 'Send an answer' }));
    readMyCounts.mockResolvedValue({ ...SOME_OF_EACH, waiting: 1 });
    await settled(() => window.dispatchEvent(new Event('focus')));
    await user.click(
      screen.getByRole('button', { name: 'The answer has gone' }),
    );

    expect(counts()).toHaveTextContent('waiting 1');
  });

  it('does not let a read answered from before an open undo it, and asks again', async () => {
    // Server actions are sent one at a time, so a poll sent before the open can be answered from
    // before it, with the kind still counted. It is dropped, and asked again after the open.
    const user = userEvent.setup();
    answerTheBell([], SOME_OF_EACH);
    draw();
    await waitFor(() => expect(counts()).toHaveTextContent('kudos 4'));
    const stale = held<PlaceCounts | null>();
    readMyCounts.mockReturnValueOnce(stale.promise);
    window.dispatchEvent(new Event('focus'));
    // What the server answers once it has been told.
    readMyCounts.mockResolvedValue({ ...SOME_OF_EACH, kudos: 0 });

    await user.click(screen.getByRole('button', { name: 'Open Kudos' }));
    await settled(() => stale.give(SOME_OF_EACH));

    expect(counts()).toHaveTextContent('kudos 0');
    expect(readMyCounts).toHaveBeenCalledTimes(3);
  });

  it('counts nothing outside a provider, and changes nothing, so a place with no bell draws no number', async () => {
    const user = userEvent.setup();
    function Bare() {
      const { markPlaceOpened } = useNavigationCountActions();
      return (
        <>
          <output aria-label="bare">{useNavigationCounts().received}</output>
          <button type="button" onClick={() => markPlaceOpened('offered')}>
            Open Feedback given unasked
          </button>
        </>
      );
    }

    render(<Bare />);
    await user.click(
      screen.getByRole('button', { name: 'Open Feedback given unasked' }),
    );

    expect(screen.getByRole('status', { name: 'bare' })).toHaveTextContent('0');
    expect(listMyNotifications).not.toHaveBeenCalled();
    expect(BELL_ACTIONS.markPlaceOpened).not.toHaveBeenCalled();
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
    expect(unreadLinesRead()).toHaveTextContent('102');
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
    await waitFor(() => expect(unreadLinesRead()).toHaveTextContent('0'));
    secondPage.give(aPage([aBellNotification('KUDOS_RECEIVED')], 101));

    await waitFor(() => expect(linesRead()).toHaveTextContent('101 lines'));
    expect(unreadLinesRead()).toHaveTextContent('0');
  });

  it('reads a page asked for before Kudos was opened as read, for its Kudos lines only', async () => {
    const user = userEvent.setup();
    const secondPage = held<NotificationsPage | null>();
    listMyNotifications.mockImplementation((page = 1) =>
      page === 1
        ? Promise.resolve(aPage(unreadLines('ASK_RECEIVED', 100), 102))
        : secondPage.promise,
    );
    draw();
    await waitFor(() => expect(linesRead()).toHaveTextContent('100 lines'));

    await user.click(screen.getByRole('button', { name: 'Read more' }));
    await user.click(screen.getByRole('button', { name: 'Open Kudos' }));
    await settled(() =>
      secondPage.give(
        aPage(
          [
            aBellNotification('KUDOS_RECEIVED'),
            aBellNotification('ASK_RECEIVED'),
          ],
          102,
        ),
      ),
    );

    expect(linesRead()).toHaveTextContent('102 lines');
    // The hundred Asks on the first page and the older Ask stay unread; the older Kudos is read.
    expect(unreadLinesRead()).toHaveTextContent('101');
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

  it('marks a line read when a poll brings it read somewhere else', async () => {
    const line = aBellNotification('ASK_RECEIVED');
    answerTheBell([line]);
    draw();
    await waitFor(() => expect(unreadLinesRead()).toHaveTextContent('1'));

    // Read on the person's phone: the newest copy is the one kept.
    answerTheBell([{ ...line, isRead: true }]);
    await settled(() => window.dispatchEvent(new Event('focus')));

    expect(counts()).toHaveTextContent('bell 0');
    expect(unreadLinesRead()).toHaveTextContent('0');
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
    await waitFor(() => expect(unreadLinesRead()).toHaveTextContent('1'));

    await user.click(screen.getByRole('button', { name: 'Read the first' }));
    await settled(() => window.dispatchEvent(new Event('focus')));

    // Still there, and still read: not dropped by the poll.
    expect(linesRead()).toHaveTextContent('101 lines');
    expect(unreadLinesRead()).toHaveTextContent('0');
  });

  it('asks again after Mark all as read drops a poll that was on its way', async () => {
    // Dropped because it was answered from before the mark; asked again, so a bell reopened
    // after it could not be read is not left on its skeleton until the next minute.
    const user = userEvent.setup();
    answerTheBell([aBellNotification('ASK_RECEIVED')]);
    draw();
    await waitFor(() => expect(unreadLinesRead()).toHaveTextContent('1'));
    const stale = held<NotificationsPage | null>();
    listMyNotifications.mockReturnValueOnce(stale.promise);
    window.dispatchEvent(new Event('focus'));

    await user.click(screen.getByRole('button', { name: 'Read all' }));
    await settled(() => stale.give(aPage([])));

    expect(listMyNotifications).toHaveBeenCalledTimes(3);
  });
});
