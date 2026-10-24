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
