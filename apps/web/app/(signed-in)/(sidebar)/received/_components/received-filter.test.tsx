import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsProvider } from '@/components/organisms/notifications-provider';
import type { ReceivedShow } from '@/lib/routes.constant';
import {
  answerTheBell,
  BELL_ACTIONS,
  NO_COUNTS,
  settled,
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

function draw(show: ReceivedShow = 'all') {
  render(
    <NotificationsProvider>
      <ReceivedFilter show={show} />
    </NotificationsProvider>,
  );
}

describe('ReceivedFilter', () => {
  it('says beside each kind how much of it is new, in red, and in words', async () => {
    answerTheBell([], { requests: 1, offered: 2, kudos: 3 });

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

  it('counts what is new in each kind, not what the bell holds unread', async () => {
    answerTheBell(unreadLines('KUDOS_RECEIVED', 5), { kudos: 1 });

    draw();

    expect(
      await screen.findByRole('button', { name: /^Kudos ?, 1 unread$/ }),
    ).toBeInTheDocument();
  });

  it('gives All no count, since it would only repeat the sidebar’s', async () => {
    answerTheBell([], { kudos: 1 });

    draw();

    await screen.findByRole('button', { name: /^Kudos ?, 1 unread$/ });
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('draws a count past ninety-nine as 99+, and says the real number', async () => {
    answerTheBell([], { kudos: 100 });

    draw();

    const kudos = await screen.findByRole('button', {
      name: /^Kudos ?, 100 unread$/,
    });
    expect(within(kudos).getByText('99+')).toBeVisible();
  });

  it('draws no count on a kind with nothing new', async () => {
    draw();

    await vi.waitFor(() =>
      expect(BELL_ACTIONS.readMyCounts).toHaveBeenCalled(),
    );
    expect(
      screen.getByRole('button', { name: 'My requests' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kudos' })).toBeInTheDocument();
  });

  it('marks the kind it is open on as opened, so its count goes and the others stay', async () => {
    answerTheBell([], { requests: 1, offered: 2, kudos: 3 });
    const { rerender } = render(
      <NotificationsProvider>
        <ReceivedFilter show="all" />
      </NotificationsProvider>,
    );
    await screen.findByRole('button', { name: /^Kudos ?, 3 unread$/ });

    rerender(
      <NotificationsProvider>
        <ReceivedFilter show="kudos" />
      </NotificationsProvider>,
    );

    expect(
      await screen.findByRole('button', { name: 'Kudos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Given to me ?, 2 unread$/ }),
    ).toBeInTheDocument();
    expect(BELL_ACTIONS.markPlaceOpened).toHaveBeenCalledExactlyOnceWith(
      'kudos',
    );
  });

  it('marks nothing opened while it shows everything at once', async () => {
    answerTheBell([], { kudos: 3 });

    draw('all');

    await screen.findByRole('button', { name: /^Kudos ?, 3 unread$/ });
    expect(BELL_ACTIONS.markPlaceOpened).not.toHaveBeenCalled();
  });

  it('counts what arrives while a kind stays open, until it is opened again', async () => {
    draw('kudos');
    await vi.waitFor(() =>
      expect(BELL_ACTIONS.markPlaceOpened).toHaveBeenCalledOnce(),
    );
    // The first poll lands before anything new arrives.
    await settled();
    BELL_ACTIONS.readMyCounts.mockResolvedValue({ ...NO_COUNTS, kudos: 1 });

    await settled(() => window.dispatchEvent(new Event('focus')));

    expect(
      screen.getByRole('button', { name: /^Kudos ?, 1 unread$/ }),
    ).toBeInTheDocument();
    expect(BELL_ACTIONS.markPlaceOpened).toHaveBeenCalledOnce();
  });
});
