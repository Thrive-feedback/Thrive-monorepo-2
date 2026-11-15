import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationBell } from '@/components/organisms/notification-bell';
import { NotificationsProvider } from '@/components/organisms/notifications-provider';
import { ROUTES } from '@/lib/routes.constant';
import {
  aBellNotification,
  answerTheBell,
} from '@/lib/test/bell-notifications';
import { SidebarNav } from './sidebar-nav';

vi.mock('next/navigation', () => ({ usePathname: () => ROUTES.home }));
vi.mock(
  '@/lib/notifications/notification-actions.service',
  async () => (await import('@/lib/test/bell-notifications')).BELL_ACTIONS,
);

beforeEach(() => {
  answerTheBell();
});

describe('SidebarNav beside the bell', () => {
  it('keeps its count when a line is read in the bell, since it counts what is new, not what is unread', async () => {
    const user = userEvent.setup();
    answerTheBell([aBellNotification('KUDOS_RECEIVED')], { kudos: 1 });
    render(
      <NotificationsProvider>
        <NotificationBell />
        <SidebarNav showsDashboard />
      </NotificationsProvider>,
    );
    expect(
      await screen.findByRole('link', { name: /^Received ?, 1 unread$/ }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Notifications, 1 unread' }),
    );
    await user.click(
      await screen.findByRole('menuitem', { name: /gave you kudos/ }),
    );

    // The menu hides the page from the accessibility tree while it closes.
    expect(
      await screen.findByRole('button', {
        name: 'Notifications',
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /^Received ?, 1 unread$/,
        hidden: true,
      }),
    ).toBeInTheDocument();
  });
});
