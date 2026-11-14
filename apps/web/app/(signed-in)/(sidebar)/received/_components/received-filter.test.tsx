import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsProvider } from '@/components/organisms/notifications-provider';
import {
  answerTheBell,
  BELL_ACTIONS,
  unreadLines,
} from '@/lib/test/bell-notifications';
import { ReceivedFilter } from './received-filter';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock(
  '@/lib/notifications/notification-actions.service',
  async () => (await import('@/lib/test/bell-notifications')).BELL_ACTIONS,
);

beforeEach(() => {
  answerTheBell();
});

function draw() {
  render(
    <NotificationsProvider>
      <ReceivedFilter show="all" />
    </NotificationsProvider>,
  );
}

describe('ReceivedFilter', () => {
  it('says beside each kind how many of it are unread in the bell, in red, and in words', async () => {
    answerTheBell([
      ...unreadLines('ASK_ANSWERED', 1),
      ...unreadLines('FEEDBACK_RECEIVED', 2),
      ...unreadLines('KUDOS_RECEIVED', 3),
    ]);

    draw();

    const requests = await screen.findByRole('button', {
      name: /^My requests ?, 1 unread$/,
    });
    expect(
      screen.getByRole('button', { name: /^Given to me ?, 2 unread$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Kudos ?, 3 unread$/ }),
    ).toBeInTheDocument();
    expect(within(requests).getByText('1')).toHaveClass('bg-attention');
  });

  it('gives All no count, since it would only repeat the sidebar’s', async () => {
    answerTheBell(unreadLines('KUDOS_RECEIVED', 1));

    draw();

    await screen.findByRole('button', { name: /^Kudos ?, 1 unread$/ });
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('draws a count past ninety-nine as 99+, and says the real number', async () => {
    answerTheBell(unreadLines('KUDOS_RECEIVED', 100));

    draw();

    const kudos = await screen.findByRole('button', {
      name: /^Kudos ?, 100 unread$/,
    });
    expect(within(kudos).getByText('99+')).toBeVisible();
  });

  it('draws no count on a kind with nothing unread', async () => {
    draw();

    await vi.waitFor(() =>
      expect(BELL_ACTIONS.listMyNotifications).toHaveBeenCalled(),
    );
    expect(
      screen.getByRole('button', { name: 'My requests' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kudos' })).toBeInTheDocument();
  });
});
