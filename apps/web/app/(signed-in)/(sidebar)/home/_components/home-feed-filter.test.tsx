import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsProvider } from '@/components/organisms/notifications-provider';
import type { HomeShow } from '@/lib/routes.constant';
import {
  answerTheBell,
  BELL_ACTIONS,
  NO_COUNTS,
  settled,
  unreadLines,
} from '@/lib/test/bell-notifications';
import { HomeFeedFilter } from './home-feed-filter';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));
vi.mock(
  '@/lib/notifications/notification-actions.service',
  async () => (await import('@/lib/test/bell-notifications')).BELL_ACTIONS,
);

beforeEach(() => {
  push.mockClear();
  answerTheBell();
});

function draw(show: HomeShow) {
  return render(
    <NotificationsProvider>
      <HomeFeedFilter show={show} />
    </NotificationsProvider>,
  );
}

describe('HomeFeedFilter', () => {
  it('says on the dropdown how much is new in Shared with me, in red, while it shows something else', async () => {
    answerTheBell([], { shared: 2 });

    draw('all');

    const showing = await screen.findByRole('combobox', {
      name: /^Show ?, 2 unread in Shared with me$/,
    });
    expect(showing).toHaveTextContent('All Feedback');
    expect(within(showing).getByText('2')).toHaveClass('bg-attention');
  });

  it('says it again beside Shared with me among the choices', async () => {
    const user = userEvent.setup();
    answerTheBell([], { shared: 2 });
    draw('everyone');

    await user.click(
      await screen.findByRole('combobox', { name: /, 2 unread in/ }),
    );

    expect(
      screen.getByRole('option', { name: /^Shared with me ?, 2 unread$/ }),
    ).toBeInTheDocument();
  });

  it('counts what is new in Shared with me, not what the bell holds unread', async () => {
    answerTheBell(unreadLines('FEEDBACK_SHARED', 5), { shared: 1 });

    draw('all');

    expect(
      await screen.findByRole('combobox', {
        name: /^Show ?, 1 unread in Shared with me$/,
      }),
    ).toBeInTheDocument();
  });

  it('marks Shared with me opened once it is chosen, so its count goes', async () => {
    answerTheBell([], { shared: 2 });
    const { rerender } = draw('all');
    await screen.findByRole('combobox', { name: /, 2 unread in/ });

    rerender(
      <NotificationsProvider>
        <HomeFeedFilter show="shared" />
      </NotificationsProvider>,
    );

    expect(
      await screen.findByRole('combobox', { name: 'Show' }),
    ).toHaveTextContent('Shared with me');
    expect(BELL_ACTIONS.markPlaceOpened).toHaveBeenCalledExactlyOnceWith(
      'shared',
    );
  });

  it.each(['all', 'everyone'] as const)(
    'marks nothing opened while it shows %s, though All holds the same Feedback',
    async (show) => {
      answerTheBell([], { shared: 2 });

      draw(show);

      await screen.findByRole('combobox', { name: /, 2 unread in/ });
      expect(BELL_ACTIONS.markPlaceOpened).not.toHaveBeenCalled();
    },
  );

  it('draws no count when nothing new has been shared', async () => {
    draw('all');

    await vi.waitFor(() =>
      expect(BELL_ACTIONS.readMyCounts).toHaveBeenCalled(),
    );
    expect(screen.getByRole('combobox', { name: 'Show' })).toHaveTextContent(
      'All Feedback',
    );
  });

  it('keeps the choice in the address', async () => {
    const user = userEvent.setup();
    draw('all');

    await user.click(screen.getByRole('combobox', { name: 'Show' }));
    await user.click(screen.getByRole('option', { name: 'Shared with me' }));

    expect(push).toHaveBeenCalledExactlyOnceWith('/home?show=shared');
  });

  it('keeps what arrives while Shared with me is showing off the dropdown, and on its choice', async () => {
    const user = userEvent.setup();
    draw('shared');
    await vi.waitFor(() =>
      expect(BELL_ACTIONS.markPlaceOpened).toHaveBeenCalledOnce(),
    );
    // The first poll lands before anything new arrives.
    await settled();
    BELL_ACTIONS.readMyCounts.mockResolvedValue({ ...NO_COUNTS, shared: 2 });

    await settled(() => window.dispatchEvent(new Event('focus')));

    const showing = screen.getByRole('combobox', { name: 'Show' });
    expect(showing).toHaveTextContent(/^Shared with me$/);
    await user.click(showing);
    expect(
      screen.getByRole('option', { name: /^Shared with me ?, 2 unread$/ }),
    ).toBeInTheDocument();
  });
});
