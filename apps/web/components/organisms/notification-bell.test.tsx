import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BellNotification } from '@/lib/notifications/notification.type';
import { NotificationBell } from './notification-bell';

const countUnreadNotifications = vi.fn();
const listMyNotifications = vi.fn();
const markNotificationRead = vi.fn();
const markAllNotificationsRead = vi.fn();
vi.mock('@/lib/notifications/notification-actions.service', () => ({
  countUnreadNotifications: () => countUnreadNotifications(),
  listMyNotifications: () => listMyNotifications(),
  markNotificationRead: (...args: unknown[]) => markNotificationRead(...args),
  markAllNotificationsRead: () => markAllNotificationsRead(),
}));

const SUBJECT = '0199ffff-0000-7000-8000-00000000000a';
const FIVE_MINUTES_AGO = new Date(Date.now() - 5 * 60_000).toISOString();

function aNotification(
  overrides: Partial<BellNotification> = {},
): BellNotification {
  return {
    id: '0199ffff-0000-7000-8000-000000000001',
    type: 'ASK_RECEIVED',
    actorName: 'Nut',
    subjectId: SUBJECT,
    createdAt: FIVE_MINUTES_AGO,
    isRead: false,
    ...overrides,
  };
}

beforeEach(() => {
  countUnreadNotifications.mockReset().mockResolvedValue(0);
  listMyNotifications.mockReset().mockResolvedValue([]);
  markNotificationRead.mockReset().mockResolvedValue(undefined);
  markAllNotificationsRead.mockReset().mockResolvedValue(true);
});

async function openTheBell(name = 'Notifications') {
  const user = userEvent.setup();
  render(<NotificationBell />);
  await user.click(await screen.findByRole('button', { name }));
  await screen.findByRole('menu');
  return user;
}

describe('NotificationBell', () => {
  it('shows no number while nothing is unread', async () => {
    countUnreadNotifications.mockResolvedValue(0);

    render(<NotificationBell />);

    expect(
      await screen.findByRole('button', { name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows how many are unread, in the name as well as the number', async () => {
    countUnreadNotifications.mockResolvedValue(3);

    render(<NotificationBell />);

    expect(
      await screen.findByRole('button', { name: 'Notifications, 3 unread' }),
    ).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it.each([
    [
      'ASK_RECEIVED',
      'Nut asked you for feedback',
      `/home?tab=waiting&ask=${SUBJECT}`,
    ],
    [
      'ASK_ANSWERED',
      'Nut answered your request',
      `/home?tab=my-requests&request=${SUBJECT}`,
    ],
    [
      'FEEDBACK_RECEIVED',
      'Nut wrote feedback to you',
      `/home?feedback=${SUBJECT}`,
    ],
    [
      'FEEDBACK_SHARED',
      'Nut shared feedback with you',
      `/home?feedback=${SUBJECT}`,
    ],
  ] as const)(
    'says "%s" and opens what it names',
    async (type, sentence, href) => {
      listMyNotifications.mockResolvedValue([aNotification({ type })]);

      await openTheBell();

      const line = await screen.findByRole('menuitem', {
        name: new RegExp(sentence),
      });
      expect(line).toHaveAttribute('href', href);
    },
  );

  it('still reads as a sentence when the person cannot be named', async () => {
    listMyNotifications.mockResolvedValue([aNotification({ actorName: null })]);

    await openTheBell();

    expect(
      await screen.findByRole('menuitem', {
        name: /Somebody asked you for feedback/,
      }),
    ).toBeInTheDocument();
  });

  it('says how long ago each one was, and marks the unread ones', async () => {
    listMyNotifications.mockResolvedValue([aNotification()]);

    await openTheBell();

    const line = await screen.findByRole('menuitem', {
      name: /asked you for feedback/,
    });
    expect(line).toHaveTextContent('5 minutes ago');
    expect(line).toHaveTextContent('Unread');
  });

  it('says in a sentence when there is nothing, rather than showing an empty box', async () => {
    listMyNotifications.mockResolvedValue([]);

    await openTheBell();

    expect(await screen.findByText(/Nothing yet\./)).toBeInTheDocument();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('marks one read and takes the number down when its line is pressed', async () => {
    countUnreadNotifications.mockResolvedValue(1);
    listMyNotifications.mockResolvedValue([aNotification()]);

    const user = await openTheBell('Notifications, 1 unread');
    await user.click(
      await screen.findByRole('menuitem', { name: /asked you for feedback/ }),
    );

    expect(markNotificationRead).toHaveBeenCalledWith(
      '0199ffff-0000-7000-8000-000000000001',
    );
    expect(
      await screen.findByRole('button', { name: 'Notifications' }),
    ).toBeInTheDocument();
  });

  it('clears the number on Mark all as read, and keeps the lines', async () => {
    countUnreadNotifications.mockResolvedValue(2);
    listMyNotifications.mockResolvedValue([
      aNotification(),
      aNotification({
        id: '0199ffff-0000-7000-8000-000000000002',
        type: 'FEEDBACK_RECEIVED',
      }),
    ]);

    const user = await openTheBell('Notifications, 2 unread');
    await user.click(
      await screen.findByRole('menuitem', { name: 'Mark all as read' }),
    );

    expect(markAllNotificationsRead).toHaveBeenCalledOnce();
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

  it('keeps the number it has when a poll fails, and says nothing about it', async () => {
    countUnreadNotifications.mockResolvedValue(null);

    render(<NotificationBell />);

    expect(
      await screen.findByRole('button', { name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says so in the panel when it could not read them', async () => {
    listMyNotifications.mockResolvedValue(null);

    await openTheBell();

    expect(await screen.findByText(/couldn't load these/)).toBeInTheDocument();
  });
});

describe('NotificationBell, over time', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks again every minute while the tab is being looked at', async () => {
    vi.useFakeTimers();
    countUnreadNotifications.mockResolvedValue(0);

    render(<NotificationBell />);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(countUnreadNotifications).toHaveBeenCalledTimes(2);
  });

  it('asks nothing while the tab is hidden, and asks again when it comes back', async () => {
    vi.useFakeTimers();
    const visibility = vi
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('hidden');

    render(<NotificationBell />);
    await vi.advanceTimersByTimeAsync(5 * 60_000);

    expect(countUnreadNotifications).not.toHaveBeenCalled();

    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);

    expect(countUnreadNotifications).toHaveBeenCalledOnce();
    visibility.mockRestore();
  });
});

describe('the gap between pressing the bell and seeing anything', () => {
  it('keeps the lines it already had when it is opened again', async () => {
    listMyNotifications.mockResolvedValue([aNotification()]);
    const user = await openTheBell();
    await screen.findByText('Nut asked you for feedback');

    // Closed and opened again. The lines it had are almost always still right, so they stay on
    // screen while the refresh happens behind them.
    await user.keyboard('{Escape}');
    let resolveRefresh: (items: BellNotification[]) => void = () => {};
    listMyNotifications.mockReturnValue(
      new Promise<BellNotification[]>((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    await user.click(screen.getByRole('button', { name: /Notifications/ }));

    expect(screen.getByText('Nut asked you for feedback')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    resolveRefresh([aNotification()]);
  });

  it('leaves the lines alone when a refresh behind them fails', async () => {
    listMyNotifications.mockResolvedValue([aNotification()]);
    const user = await openTheBell();
    await screen.findByText('Nut asked you for feedback');

    await user.keyboard('{Escape}');
    listMyNotifications.mockResolvedValue(null);
    await user.click(screen.getByRole('button', { name: /Notifications/ }));

    // A failed refresh is not worth replacing what somebody is already reading.
    await waitFor(() => {
      expect(listMyNotifications).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('Nut asked you for feedback')).toBeInTheDocument();
  });

  it('shows a skeleton the shape of the rows on the very first open', async () => {
    let resolveFirst: (items: BellNotification[]) => void = () => {};
    listMyNotifications.mockReturnValue(
      new Promise<BellNotification[]>((resolve) => {
        resolveFirst = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<NotificationBell />);
    await user.click(
      await screen.findByRole('button', { name: /Notifications/ }),
    );

    // Announced as loading, with rows at the height the real ones will be so the panel does not
    // resize as they arrive.
    expect(await screen.findByRole('status')).toBeInTheDocument();
    resolveFirst([aNotification()]);
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
});

describe('when answers come back out of order, or late', () => {
  it('does not let a slow failed open wipe lines a later one painted', async () => {
    let failSlowOpen: (items: BellNotification[] | null) => void = () => {};
    listMyNotifications.mockReturnValueOnce(
      new Promise<BellNotification[] | null>((resolve) => {
        failSlowOpen = resolve;
      }),
    );
    const user = await openTheBell();
    await user.keyboard('{Escape}');

    listMyNotifications.mockResolvedValue([aNotification()]);
    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    await screen.findByText('Nut asked you for feedback');

    // The first open finally gives up, after the second already painted. What somebody is
    // reading is worth more than a message about a request they have forgotten about.
    failSlowOpen(null);
    await waitFor(() => {
      expect(
        screen.getByText('Nut asked you for feedback'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/couldn't load these/i)).not.toBeInTheDocument();
  });

  it('lets the newest answer win, not the slowest', async () => {
    let finishFirst: (items: BellNotification[]) => void = () => {};
    listMyNotifications.mockReturnValueOnce(
      new Promise<BellNotification[]>((resolve) => {
        finishFirst = resolve;
      }),
    );
    const user = await openTheBell();
    await user.keyboard('{Escape}');

    listMyNotifications.mockResolvedValue([
      aNotification({ actorName: 'Ploy' }),
    ]);
    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    await screen.findByText('Ploy asked you for feedback');

    finishFirst([aNotification({ actorName: 'Stale' })]);
    await waitFor(() => {
      expect(screen.queryByText('Stale asked you for feedback')).toBeNull();
    });
    expect(screen.getByText('Ploy asked you for feedback')).toBeInTheDocument();
  });

  it('says it could not look when a reopen fails and there was nothing to keep', async () => {
    // An empty bell and a bell that could not be read are different answers (#269), and an
    // empty first open must not make the second one lie.
    listMyNotifications.mockResolvedValue([]);
    const user = await openTheBell();
    await screen.findByText(/Nothing yet/);

    await user.keyboard('{Escape}');
    listMyNotifications.mockResolvedValue(null);
    await user.click(screen.getByRole('button', { name: /Notifications/ }));

    expect(
      await screen.findByText(/couldn't load these just now/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Nothing yet/)).not.toBeInTheDocument();
  });
});
