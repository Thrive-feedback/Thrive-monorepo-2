import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  BellNotification,
  NotificationsPage,
} from '@/lib/notifications/notification.type';
import {
  aBellNotification,
  answerTheBell,
  aPage,
  BELL_ACTIONS,
  settled,
  unreadLines,
} from '@/lib/test/bell-notifications';
import { NotificationBell } from './notification-bell';
import { NotificationsProvider } from './notifications-provider';

vi.mock(
  '@/lib/notifications/notification-actions.service',
  async () => (await import('@/lib/test/bell-notifications')).BELL_ACTIONS,
);

const SUBJECT = '0199ffff-0000-7000-8000-00000000000a';
const { countUnreadNotifications, listMyNotifications } = BELL_ACTIONS;

beforeEach(() => {
  answerTheBell();
});

/** The bell as the layout mounts it: under the provider that reads its lines. */
function drawBell() {
  render(
    <NotificationsProvider>
      <NotificationBell />
    </NotificationsProvider>,
  );
}

async function openTheBell(name: string | RegExp = /^Notifications/) {
  const user = userEvent.setup();
  drawBell();
  await user.click(await screen.findByRole('button', { name }));
  await screen.findByRole('menu');
  return user;
}

/** An answer the test gives when it chooses, to put a read in flight. */
function held<T>() {
  let give: (value: T) => void = () => {};
  const promise = new Promise<T>((resolve) => {
    give = resolve;
  });
  return { promise, give };
}

describe('NotificationBell', () => {
  it('shows no number while nothing is unread', async () => {
    answerTheBell([aBellNotification('ASK_RECEIVED', { isRead: true })]);

    drawBell();

    expect(
      await screen.findByRole('button', { name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows how many are unread, in the name as well as the number', async () => {
    answerTheBell(unreadLines('ASK_RECEIVED', 3));

    drawBell();

    expect(
      await screen.findByRole('button', { name: 'Notifications, 3 unread' }),
    ).toBeInTheDocument();
    // In the red a count waiting on the person is drawn in.
    expect(screen.getByText('3')).toHaveClass('bg-attention');
  });

  it('shows the API’s count, not how many lines it has read', async () => {
    answerTheBell(unreadLines('ASK_RECEIVED', 2));
    countUnreadNotifications.mockResolvedValue(42);

    drawBell();

    expect(
      await screen.findByRole('button', { name: 'Notifications, 42 unread' }),
    ).toBeInTheDocument();
  });

  it('draws anything past ninety-nine as 99+, and says the real number', async () => {
    countUnreadNotifications.mockResolvedValue(120);

    drawBell();

    expect(
      await screen.findByRole('button', { name: 'Notifications, 120 unread' }),
    ).toBeInTheDocument();
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it.each([
    ['ASK_RECEIVED', 'Nut asked you for feedback', `/waiting?ask=${SUBJECT}`],
    ['ASK_ANSWERED', 'Nut answered your request', '/received?show=requests'],
    [
      'FEEDBACK_RECEIVED',
      'Nut wrote feedback to you',
      `/received?show=offered&feedback=${SUBJECT}`,
    ],
    [
      'FEEDBACK_SHARED',
      'Nut shared feedback with you',
      `/home?feedback=${SUBJECT}`,
    ],
    ['KUDOS_RECEIVED', 'Nut gave you kudos', '/received?show=kudos'],
  ] as const)(
    'says "%s" and opens what it names',
    async (type, sentence, href) => {
      answerTheBell([aBellNotification(type)]);

      await openTheBell();

      const line = await screen.findByRole('menuitem', {
        name: new RegExp(sentence),
      });
      expect(line).toHaveAttribute('href', href);
    },
  );

  it('still reads as a sentence when the person cannot be named', async () => {
    answerTheBell([aBellNotification('ASK_RECEIVED', { actorName: null })]);

    await openTheBell();

    expect(
      await screen.findByRole('menuitem', {
        name: /Somebody asked you for feedback/,
      }),
    ).toBeInTheDocument();
  });

  it('says how long ago each one was, and marks the unread ones', async () => {
    answerTheBell([
      aBellNotification('ASK_RECEIVED', {
        createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      }),
    ]);

    await openTheBell();

    const line = await screen.findByRole('menuitem', {
      name: /asked you for feedback/,
    });
    expect(line).toHaveTextContent('5 minutes ago');
    expect(line).toHaveTextContent('Unread');
  });

  it('shows the face of who did it, by their initials when they have no photo', async () => {
    answerTheBell([
      aBellNotification('ASK_RECEIVED', { actorName: 'Nut Somchai' }),
    ]);

    await openTheBell();

    const line = await screen.findByRole('menuitem', {
      name: /Nut Somchai asked you for feedback/,
    });
    expect(line).toHaveTextContent('NS');
  });

  it.each([
    ['ASK_RECEIVED', /asked you for feedback/, 'bg-action-tertiary'],
    ['ASK_ANSWERED', /answered your request/, 'bg-action-tertiary'],
    ['FEEDBACK_RECEIVED', /wrote feedback to you/, 'bg-action-primary'],
    ['FEEDBACK_SHARED', /shared feedback with you/, 'bg-action-primary'],
    ['KUDOS_RECEIVED', /gave you kudos/, 'bg-action-secondary'],
  ] as const)(
    'marks a %s line in the colour of the card it opens: its dot, ringed while unread, and its highlight',
    async (type, name, fill) => {
      const ring = fill.replace('bg-', 'outline-');
      answerTheBell([
        aBellNotification(type),
        aBellNotification(type, { isRead: true }),
      ]);

      await openTheBell();

      const [unread, read] = await screen.findAllByRole('menuitem', { name });
      // The dot is drawn for the eye alone; the line says "Unread" in words as well.
      const unreadDot = unread?.querySelector('[aria-hidden="true"]');
      const readDot = read?.querySelector('[aria-hidden="true"]');
      // A ring a gap away from the dot: the width and the offset are the gap the eye reads.
      expect(unreadDot).toHaveClass(
        fill,
        ring,
        'outline-2',
        'outline-offset-2',
      );
      // Read, the dot stays in its colour and only the ring goes.
      expect(readDot).toHaveClass(fill);
      expect(readDot).not.toHaveClass(ring);
      // Pointed at or focused, either line is tinted in the same colour, not the menu's own.
      const highlight = `data-highlighted:${fill}-surface-hover`;
      for (const line of [unread, read]) {
        expect(line).toHaveClass(highlight);
        expect(line).not.toHaveClass(
          'data-highlighted:bg-action-neutral-surface-hover',
        );
      }
    },
  );

  it('leaves out a line of a kind it has no sentence for, and draws the rest', async () => {
    // A kind a newer API or web server knows, handed to a bundle built before it. Read back
    // through JSON, as it arrives, rather than cast to a kind it is not.
    const unknown: BellNotification = JSON.parse(
      JSON.stringify({
        ...aBellNotification('ASK_RECEIVED'),
        type: 'SOMETHING_LATER',
      }),
    );
    answerTheBell([unknown, aBellNotification('KUDOS_RECEIVED')]);

    await openTheBell();

    expect(
      await screen.findByRole('menuitem', { name: /Nut gave you kudos/ }),
    ).toBeInTheDocument();
    const lines = screen
      .getAllByRole('menuitem')
      .filter((item) => item.textContent !== 'Mark all as read');
    expect(lines).toHaveLength(1);
  });

  it('sets an unread line in bold as well as ringing its dot, so the ring is never the only cue', async () => {
    // The orange ring is below 3:1 on the panel, so it must stay a second cue (WCAG 1.4.11).
    answerTheBell([
      aBellNotification('KUDOS_RECEIVED'),
      aBellNotification('KUDOS_RECEIVED', { isRead: true }),
    ]);

    await openTheBell();

    const [unread, read] = await screen.findAllByText('Nut gave you kudos');
    expect(unread).toHaveClass('font-semibold');
    expect(read).not.toHaveClass('font-semibold');
  });

  it('says in words when there is nothing, rather than showing an empty box', async () => {
    await openTheBell();

    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
    expect(screen.getByText(/or gives you kudos/)).toBeInTheDocument();
    // Inside the menu, where ARIA allows no heading, and the page's outline gains none.
    expect(
      screen.queryByRole('heading', { name: 'Nothing yet' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/When somebody asks you for feedback/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('marks one read and takes the number down when its line is pressed', async () => {
    const line = aBellNotification('ASK_RECEIVED');
    answerTheBell([line]);

    const user = await openTheBell('Notifications, 1 unread');
    await user.click(
      await screen.findByRole('menuitem', { name: /asked you for feedback/ }),
    );

    expect(BELL_ACTIONS.markNotificationRead).toHaveBeenCalledWith(line.id);
    expect(
      await screen.findByRole('button', { name: 'Notifications' }),
    ).toBeInTheDocument();
  });

  it('clears the number on Mark all as read, and keeps the lines', async () => {
    answerTheBell([
      aBellNotification('ASK_RECEIVED'),
      aBellNotification('FEEDBACK_RECEIVED'),
    ]);

    const user = await openTheBell('Notifications, 2 unread');
    await user.click(
      await screen.findByRole('menuitem', { name: 'Mark all as read' }),
    );

    expect(BELL_ACTIONS.markAllNotificationsRead).toHaveBeenCalledOnce();
    // The open menu hides the rest of the page from the accessibility tree, so the bell itself
    // is only reachable here as a hidden element.
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Notifications', hidden: true }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /asked you for feedback/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /wrote feedback to you/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Unread')).not.toBeInTheDocument();
  });

  it('keeps the number and the lines when Mark all as read is refused', async () => {
    answerTheBell([aBellNotification('ASK_RECEIVED')]);
    BELL_ACTIONS.markAllNotificationsRead.mockResolvedValue(false);

    const user = await openTheBell('Notifications, 1 unread');
    await user.click(
      await screen.findByRole('menuitem', { name: 'Mark all as read' }),
    );

    await waitFor(() =>
      expect(BELL_ACTIONS.markAllNotificationsRead).toHaveBeenCalledOnce(),
    );
    expect(
      screen.getByRole('button', {
        name: 'Notifications, 1 unread',
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /asked you for feedback/ }),
    ).toHaveTextContent('Unread');
  });

  it('keeps the number it has when a poll fails, and says nothing about it', async () => {
    countUnreadNotifications.mockResolvedValue(null);
    listMyNotifications.mockResolvedValue(null);

    drawBell();

    expect(
      await screen.findByRole('button', { name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the number it has when a poll never reaches the server', async () => {
    answerTheBell(unreadLines('ASK_RECEIVED', 3));
    drawBell();
    await screen.findByRole('button', { name: 'Notifications, 3 unread' });
    countUnreadNotifications.mockRejectedValue(new Error('Failed to fetch'));
    listMyNotifications.mockRejectedValue(new Error('Failed to fetch'));

    await settled(() => window.dispatchEvent(new Event('focus')));

    expect(listMyNotifications).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole('button', { name: 'Notifications, 3 unread' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('takes the number down when pressing a line never reaches the server', async () => {
    answerTheBell([aBellNotification('ASK_RECEIVED')]);
    BELL_ACTIONS.markNotificationRead.mockRejectedValue(
      new Error('Failed to fetch'),
    );
    const user = await openTheBell('Notifications, 1 unread');

    await user.click(
      await screen.findByRole('menuitem', { name: /asked you for feedback/ }),
    );

    expect(
      await screen.findByRole('button', { name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(BELL_ACTIONS.markNotificationRead).toHaveBeenCalledOnce();
  });

  it('says so in the panel when it could not read them', async () => {
    listMyNotifications.mockResolvedValue(null);

    await openTheBell();

    expect(await screen.findByText(/couldn't load these/)).toBeInTheDocument();
  });
});

describe('a bell with more lines than one page', () => {
  /** Says the list has scrolled to `fromTheEnd` pixels short of its last line. */
  function scrollTheLines(fromTheEnd: number) {
    const list = screen.getByRole('group', { name: 'Notifications' });
    Object.defineProperty(list, 'scrollHeight', {
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(list, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    list.scrollTop = 1500 - fromTheEnd;
    fireEvent.scroll(list);
  }

  it('draws every line of the first page, all in one list that scrolls', async () => {
    answerTheBell(unreadLines('KUDOS_RECEIVED', 100));

    await openTheBell();

    expect(
      await screen.findAllByRole('menuitem', { name: /gave you kudos/ }),
    ).toHaveLength(100);
  });

  it('reads the next page as the person scrolls near the end, and adds it under the first', async () => {
    const firstPage = unreadLines('KUDOS_RECEIVED', 100);
    const secondPage = [
      aBellNotification('ASK_RECEIVED', { actorName: 'Ploy' }),
    ];
    listMyNotifications.mockImplementation(async (page = 1) =>
      aPage(page === 1 ? firstPage : secondPage, 101),
    );
    await openTheBell();
    await screen.findAllByRole('menuitem', { name: /gave you kudos/ });

    scrollTheLines(100);

    expect(
      await screen.findByRole('menuitem', {
        name: /Ploy asked you for feedback/,
      }),
    ).toBeInTheDocument();
    expect(listMyNotifications).toHaveBeenCalledWith(2);
    expect(
      screen.getAllByRole('menuitem', { name: /gave you kudos/ }),
    ).toHaveLength(100);
  });

  it('asks for nothing more while the person is far from the end, or once everything is read', async () => {
    answerTheBell(unreadLines('KUDOS_RECEIVED', 3));
    await openTheBell();
    await screen.findAllByRole('menuitem', { name: /gave you kudos/ });

    scrollTheLines(0);

    expect(listMyNotifications).not.toHaveBeenCalledWith(2);
  });

  it('asks for one page at a time, however often the list scrolls while it is on its way', async () => {
    const secondPage = held<NotificationsPage | null>();
    listMyNotifications.mockImplementation((page = 1) =>
      page === 1
        ? Promise.resolve(aPage(unreadLines('KUDOS_RECEIVED', 100), 150))
        : secondPage.promise,
    );
    await openTheBell();
    await screen.findAllByRole('menuitem', { name: /gave you kudos/ });

    scrollTheLines(100);
    scrollTheLines(50);
    scrollTheLines(0);

    // Shown as loading while it is on its way.
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(
      listMyNotifications.mock.calls.filter(([page]) => page === 2),
    ).toHaveLength(1);
    secondPage.give(aPage([], 150));
  });
});

describe('NotificationBell, over time', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks again every minute while the tab is being looked at', async () => {
    vi.useFakeTimers();

    drawBell();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(listMyNotifications).toHaveBeenCalledTimes(2);
    expect(countUnreadNotifications).toHaveBeenCalledTimes(2);
  });

  it('asks nothing while the tab is hidden, and asks again when it comes back', async () => {
    vi.useFakeTimers();
    const visibility = vi
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('hidden');

    drawBell();
    await vi.advanceTimersByTimeAsync(5 * 60_000);

    expect(listMyNotifications).not.toHaveBeenCalled();

    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);

    expect(listMyNotifications).toHaveBeenCalledOnce();
    visibility.mockRestore();
  });

  it('asks once when the tab comes back and the window takes focus together', async () => {
    drawBell();
    await waitFor(() => expect(listMyNotifications).toHaveBeenCalledOnce());
    const answer = held<NotificationsPage | null>();
    listMyNotifications.mockReturnValue(answer.promise);

    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));

    expect(listMyNotifications).toHaveBeenCalledTimes(2);
    answer.give(aPage([]));
  });
});

describe('the gap between pressing the bell and seeing anything', () => {
  it('keeps the lines it already had when it is opened again', async () => {
    answerTheBell([aBellNotification('ASK_RECEIVED')]);
    const user = await openTheBell();
    await screen.findByText('Nut asked you for feedback');

    // Closed and opened again. The lines it had are almost always still right, so they stay on
    // screen while the refresh happens behind them.
    await user.keyboard('{Escape}');
    const refresh = held<NotificationsPage | null>();
    listMyNotifications.mockReturnValue(refresh.promise);
    await user.click(screen.getByRole('button', { name: /Notifications/ }));

    expect(screen.getByText('Nut asked you for feedback')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    refresh.give(aPage([]));
  });

  it('leaves the lines alone when a refresh behind them fails', async () => {
    answerTheBell([aBellNotification('ASK_RECEIVED')]);
    const user = await openTheBell();
    await screen.findByText('Nut asked you for feedback');

    await user.keyboard('{Escape}');
    listMyNotifications.mockResolvedValue(null);
    await user.click(screen.getByRole('button', { name: /Notifications/ }));

    // A failed refresh is not worth replacing what somebody is already reading. Three reads: the
    // one on arrival, the first open and this one.
    await settled();
    expect(listMyNotifications).toHaveBeenCalledTimes(3);
    expect(screen.getByText('Nut asked you for feedback')).toBeInTheDocument();
  });

  it('shows a skeleton the shape of the rows on the very first open', async () => {
    const first = held<NotificationsPage | null>();
    listMyNotifications.mockReturnValue(first.promise);
    const user = userEvent.setup();
    drawBell();
    await user.click(
      await screen.findByRole('button', { name: /Notifications/ }),
    );

    // Announced as loading, with rows at the height the real ones will be so the panel does not
    // resize as they arrive.
    expect(await screen.findByRole('status')).toBeInTheDocument();
    first.give(aPage([aBellNotification('ASK_RECEIVED')]));
    await screen.findByText('Nut asked you for feedback');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('still says it could not look when there is nothing to fall back on', async () => {
    listMyNotifications.mockResolvedValue(null);

    await openTheBell();

    // "Nothing yet" and "we could not look" are different answers, and this is the second.
    expect(
      await screen.findByText(/couldn't load these just now/i),
    ).toBeInTheDocument();
  });

  it('tries again with the skeleton when a bell that could not be read is opened again', async () => {
    listMyNotifications.mockResolvedValue(null);
    const user = await openTheBell();
    await screen.findByText(/couldn't load these/);

    await user.keyboard('{Escape}');
    const retry = held<NotificationsPage | null>();
    listMyNotifications.mockReturnValue(retry.promise);
    await user.click(screen.getByRole('button', { name: /Notifications/ }));

    expect(await screen.findByRole('status')).toBeInTheDocument();
    retry.give(aPage([aBellNotification('ASK_RECEIVED')]));
    expect(
      await screen.findByText('Nut asked you for feedback'),
    ).toBeInTheDocument();
  });
});

describe('when answers come back late', () => {
  it('waits for the read already on its way rather than sending a second behind it', async () => {
    const onArrival = held<NotificationsPage | null>();
    listMyNotifications.mockReturnValueOnce(onArrival.promise);

    await openTheBell();

    // Opening while the read on arrival is out joins it: server actions queue, so a second read
    // could only be answered after the first anyway.
    expect(listMyNotifications).toHaveBeenCalledOnce();
    onArrival.give(aPage([aBellNotification('ASK_RECEIVED')]));
    expect(
      await screen.findByText('Nut asked you for feedback'),
    ).toBeInTheDocument();
  });

  it('keeps an empty bell empty, open, through a poll that fails', async () => {
    // "Nothing yet" was a true answer; a later poll that could not look does not make it false,
    // and an open panel must not flash a skeleton or an error at somebody reading it.
    const user = await openTheBell();
    await screen.findByText('Nothing yet');
    listMyNotifications.mockResolvedValue(null);

    await settled(() => window.dispatchEvent(new Event('focus')));

    expect(listMyNotifications).toHaveBeenCalledTimes(3);
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    expect(screen.queryByText(/couldn't load these/)).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
  });

  it('does not let a read sent before a line was pressed mark it unread again', async () => {
    const line = aBellNotification('KUDOS_RECEIVED');
    answerTheBell([line]);
    const user = await openTheBell('Notifications, 1 unread');
    await screen.findByRole('menuitem', { name: /gave you kudos/ });

    // A poll goes out, and is answered from before the line is pressed.
    const stale = held<NotificationsPage | null>();
    listMyNotifications.mockReturnValue(stale.promise);
    countUnreadNotifications.mockResolvedValue(1);
    window.dispatchEvent(new Event('focus'));
    await user.click(screen.getByRole('menuitem', { name: /gave you kudos/ }));
    await settled(() => stale.give(aPage([line])));

    // Answered from before the press, it would say 1 unread again.
    expect(
      screen.getByRole('button', { name: 'Notifications', hidden: true }),
    ).toBeInTheDocument();
  });
});
