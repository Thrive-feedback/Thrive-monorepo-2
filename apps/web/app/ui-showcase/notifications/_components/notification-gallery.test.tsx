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
      screen.getByRole('button', { name: /open the sample bell, 5 unread/i }),
    );
    const menu = await screen.findByRole('menu');

    const lines = within(menu)
      .getAllByRole('menuitem')
      .filter((item) => item.textContent !== 'Mark all as read');
    expect(lines).toHaveLength(SAMPLE_NOTIFICATIONS.length);
    expect(within(menu).getAllByText('Unread')).toHaveLength(5);
    expect(
      within(menu).getByText('Somebody asked you for feedback'),
    ).toBeInTheDocument();
  });

  it('draws where a pressed line lands instead of following its link', async () => {
    const user = userEvent.setup();
    render(<NotificationGallery />);

    expect(screen.getByText('No line pressed yet')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /open the sample bell, 5 unread/i }),
    );
    const menu = await screen.findByRole('menu');
    await user.click(
      within(menu).getByRole('menuitem', {
        name: /Ann Lee asked you for feedback/,
      }),
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const landing = screen.getByRole('figure', {
      name: 'Where the pressed line lands',
    });
    expect(
      within(landing).getByText(
        /“Ann Lee asked you for feedback” opens Waiting for me/,
      ),
    ).toBeInTheDocument();
    expect(
      within(landing).getByText('/waiting?ask=sample-ask'),
    ).toBeInTheDocument();
    expect(within(landing).getByText('Waiting for me')).toBeInTheDocument();
    expect(
      within(landing).getByText('The Ask, on the postcard it is answered on'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /open the sample bell, 4 unread/i }),
    ).toHaveFocus();
  });

  it('draws where the last line lands, so a press never lands on its neighbour', async () => {
    const user = userEvent.setup();
    render(<NotificationGallery />);

    await user.click(
      screen.getByRole('button', { name: /open the sample bell/i }),
    );
    const menu = await screen.findByRole('menu');
    await user.click(
      within(menu).getByRole('menuitem', {
        name: /Somebody asked you for feedback/,
      }),
    );

    // The pressed line is found by its place among the panel's links, so the last one is the
    // one a shifted count would get wrong.
    const landing = screen.getByRole('figure', {
      name: 'Where the pressed line lands',
    });
    expect(
      within(landing).getByText(
        /“Somebody asked you for feedback” opens Waiting for me/,
      ),
    ).toBeInTheDocument();
  });

  it('draws where a Kudos line lands, pressed from the keyboard', async () => {
    const user = userEvent.setup();
    render(<NotificationGallery />);

    await user.click(
      screen.getByRole('button', { name: /open the sample bell/i }),
    );
    const menu = await screen.findByRole('menu');
    within(menu)
      .getByRole('menuitem', { name: /Mai Tanaka gave you kudos/ })
      .focus();
    await user.keyboard('{Enter}');

    const landing = screen.getByRole('figure', {
      name: 'Where the pressed line lands',
    });
    expect(
      within(landing).getByText(/“Mai Tanaka gave you kudos” opens Received/),
    ).toBeInTheDocument();
    expect(
      within(landing).getByText('/received?show=kudos'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /open the sample bell, 4 unread/i }),
    ).toHaveFocus();
  });

  it('draws the filter a line opens on when it opens a list', async () => {
    const user = userEvent.setup();
    render(<NotificationGallery />);

    await user.click(
      screen.getByRole('button', { name: /open the sample bell/i }),
    );
    const menu = await screen.findByRole('menu');
    await user.click(
      within(menu).getByRole('menuitem', {
        name: /Nut Somchai answered your request/,
      }),
    );

    const landing = screen.getByRole('figure', {
      name: 'Where the pressed line lands',
    });
    expect(
      within(landing).getByText('/received?show=requests'),
    ).toBeInTheDocument();
    expect(within(landing).getByText('My requests')).toBeInTheDocument();
    expect(
      within(landing).queryByText('Open over the page'),
    ).not.toBeInTheDocument();
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
