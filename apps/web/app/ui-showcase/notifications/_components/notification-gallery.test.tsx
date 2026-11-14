import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_KINDS,
  SAMPLE_NOTIFICATIONS,
} from '@/app/ui-showcase/notifications/_lib/notification-kinds.constant';
import { NotificationGallery } from './notification-gallery';

describe('NotificationGallery', () => {
  it('shows every kind with its bell sentence and where it leads', () => {
    render(<NotificationGallery />);

    for (const kind of Object.values(NOTIFICATION_KINDS)) {
      expect(
        screen.getByRole('heading', { level: 3, name: kind.title }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByText('“Ann Lee asked you for feedback”'),
    ).toBeInTheDocument();
    expect(screen.getByText('/waiting?ask={id}')).toBeInTheDocument();
    expect(screen.getByText('/received?show=requests')).toBeInTheDocument();
    expect(screen.getAllByText('/home?feedback={id}')).toHaveLength(2);
  });

  it('shows the panel with nothing in it, as every empty place for cards is drawn', () => {
    render(<NotificationGallery />);

    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });

  it('opens a sample bell with one line per sample, unread ones said so', async () => {
    const user = userEvent.setup();
    render(<NotificationGallery />);

    await user.click(
      screen.getByRole('button', { name: /open the sample bell, 4 unread/i }),
    );
    const menu = await screen.findByRole('menu');

    const lines = within(menu)
      .getAllByRole('menuitem')
      .filter((item) => item.textContent !== 'Mark all as read');
    expect(lines).toHaveLength(SAMPLE_NOTIFICATIONS.length);
    expect(within(menu).getAllByText('Unread')).toHaveLength(4);
    expect(
      within(menu).getByText('Somebody asked you for feedback'),
    ).toBeInTheDocument();
  });

  it('marks every line read and keeps the panel open', async () => {
    const user = userEvent.setup();
    render(<NotificationGallery />);

    await user.click(
      screen.getByRole('button', { name: /open the sample bell/i }),
    );
    const menu = await screen.findByRole('menu');
    await user.click(
      within(menu).getByRole('menuitem', { name: 'Mark all as read' }),
    );

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(within(menu).queryByText('Unread')).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(
      screen.getByRole('button', { name: /open the sample bell, 0 unread/i }),
    ).toBeInTheDocument();
  });
});
