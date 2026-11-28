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
  // The sidebar stands beside the page from md, where the bell's panel drops from it as a menu.
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) satisfies MediaQueryList,
  );
});

describe('SidebarNav beside the bell', () => {
  it('takes its count down the moment a line is read in the bell, as the layout mounts them', async () => {
    const user = userEvent.setup();
    answerTheBell([aBellNotification('KUDOS_RECEIVED')]);
    render(
      <NotificationsProvider>
        <NotificationBell />
        <SidebarNav showsDashboard oneOnOnesToAnswer={0} isAdmin={false} />
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
      await screen.findByRole('link', { name: /^Received$/, hidden: true }),
    ).toBeInTheDocument();
  });
});
