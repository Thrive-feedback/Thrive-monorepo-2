import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NotificationsProvider,
  useNavigationCounts,
} from '@/components/organisms/notifications-provider';
import { answerTheBell, BELL_ACTIONS } from '@/lib/test/bell-notifications';
import { WaitingOpened } from './waiting-opened';

vi.mock(
  '@/lib/notifications/notification-actions.service',
  async () => (await import('@/lib/test/bell-notifications')).BELL_ACTIONS,
);

beforeEach(() => {
  answerTheBell([], { waiting: 2 });
});

function WaitingCount() {
  return (
    <output aria-label="Waiting for me">{useNavigationCounts().waiting}</output>
  );
}

describe('WaitingOpened', () => {
  it('tells the bell Waiting for me is open, and leaves its count to answering', async () => {
    render(
      <NotificationsProvider>
        <WaitingCount />
        <WaitingOpened />
      </NotificationsProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole('status', { name: 'Waiting for me' }),
      ).toHaveTextContent('2'),
    );
    expect(BELL_ACTIONS.markPlaceOpened).toHaveBeenCalledExactlyOnceWith(
      'waiting',
    );
  });
});
