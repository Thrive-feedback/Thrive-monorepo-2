import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsProvider } from '@/components/organisms/notifications-provider';
import type { BellNotification } from '@/lib/notifications/notification.type';
import { ROUTES } from '@/lib/routes.constant';
import { answerTheBell, unreadLines } from '@/lib/test/bell-notifications';
import { ComposeMenu } from './compose-menu';
import { TabBar } from './tab-bar';

const usePathname = vi.fn((): string => ROUTES.home);
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => usePathname(),
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardFeedback: vi.fn(),
    sendPostcardRequest: vi.fn(),
    sendKudosCard: vi.fn(),
  }),
);

vi.mock(
  '@/lib/notifications/notification-actions.service',
  async () => (await import('@/lib/test/bell-notifications')).BELL_ACTIONS,
);

function draw(
  path: string = ROUTES.home,
  waiting = 0,
  showsDashboard = true,
  extra: BellNotification[] = [],
) {
  usePathname.mockReturnValue(path);
  answerTheBell([...unreadLines('ASK_RECEIVED', waiting), ...extra]);
  render(
    <NotificationsProvider>
      <TabBar showsDashboard={showsDashboard}>
        <ComposeMenu
          workspaceId="workspace-acme"
          teammates={[]}
          workspaceGoals={[]}
          writer={{ name: 'Ann', photoUrl: null }}
          placement="tab-bar"
        />
      </TabBar>
    </NotificationsProvider>,
  );
  return screen.getByRole('navigation', { name: 'Main' });
}

describe('TabBar', () => {
  it('lists Home, the Kudos board, "+", Waiting for me and More, in that order', () => {
    const nav = draw();

    expect(
      within(nav)
        .getAllByRole('listitem')
        .map(
          (item) =>
            (
              within(item).queryByRole('link') ??
              within(item).getByRole('button')
            ).textContent,
        ),
    ).toEqual([
      'Home',
      'Kudos board',
      'Write something',
      'Waiting for me',
      'More',
    ]);
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      ROUTES.home,
    );
    expect(
      within(nav).getByRole('link', { name: 'Kudos board' }),
    ).toHaveAttribute('href', ROUTES.kudos);
    expect(
      within(nav).getByRole('link', { name: 'Waiting for me' }),
    ).toHaveAttribute('href', ROUTES.waiting);
  });

  it('reads the count of unread Asks after Waiting for me, as the sidebar does', async () => {
    const nav = draw(ROUTES.home, 3);

    expect(
      await within(nav).findByRole('link', {
        name: /^Waiting for me ?, 3 unread$/,
      }),
    ).toBeVisible();
  });

  it('draws a count past ninety-nine as 99+, and says the real number', async () => {
    const nav = draw(ROUTES.home, 150);

    const waiting = await within(nav).findByRole('link', {
      name: /^Waiting for me ?, 150 unread$/,
    });
    expect(within(waiting).getByText('99+')).toBeVisible();
  });

  it('shows what Received holds of the bell on More, and beside Received inside it', async () => {
    const user = userEvent.setup();
    const nav = draw(ROUTES.home, 0, true, [
      ...unreadLines('ASK_ANSWERED', 1),
      ...unreadLines('KUDOS_RECEIVED', 1),
    ]);
    // Drawn on More's icon and read after its name, saying where they are, as Waiting's is.
    const more = await within(nav).findByRole('button', {
      name: /^More ?, 2 unread in Received$/,
    });

    await user.click(more);

    expect(
      await screen.findByRole('menuitem', { name: /^Received ?, 2 unread$/ }),
    ).toBeInTheDocument();
  });

  it('marks the page that is open, and More only on a page it opens', () => {
    const nav = draw(ROUTES.kudos);

    expect(
      within(nav).getByRole('link', { name: 'Kudos board' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(
      within(nav).getByRole('button', { name: 'More' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('opens Teammates, then My Feedback’s Your dashboard, Received and Given, from More', async () => {
    const user = userEvent.setup();
    const nav = draw(ROUTES.home);

    await user.click(within(nav).getByRole('button', { name: 'More' }));

    const menu = screen.getByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => [item.textContent, item.getAttribute('href')]),
    ).toEqual([
      ['Teammates', ROUTES.teammates],
      ['Your dashboard', ROUTES.dashboard],
      ['Received', ROUTES.received],
      ['Given', ROUTES.given],
    ]);
    expect(within(menu).getByText('My Feedback')).toBeVisible();
  });

  it('leaves Your dashboard out of More where the deployment has switched it off', async () => {
    const user = userEvent.setup();
    const nav = draw(ROUTES.home, 0, false);

    await user.click(within(nav).getByRole('button', { name: 'More' }));

    expect(
      within(screen.getByRole('menu'))
        .getAllByRole('menuitem')
        .map((item) => item.getAttribute('href')),
    ).toEqual([ROUTES.teammates, ROUTES.received, ROUTES.given]);
  });

  it('does not mark More on the dashboard’s address where it is switched off, since More does not lead there', () => {
    const nav = draw(ROUTES.dashboard, 0, false);

    expect(
      within(nav).getByRole('button', { name: 'More' }),
    ).not.toHaveAttribute('aria-current');
  });

  it.each([ROUTES.teammates, ROUTES.dashboard, ROUTES.received, ROUTES.given])(
    'marks More, and the page in its menu, on %s',
    async (path) => {
      const user = userEvent.setup();
      const nav = draw(path);
      const more = within(nav).getByRole('button', { name: 'More' });

      expect(more).toHaveAttribute('aria-current', 'page');

      await user.click(more);

      expect(
        within(screen.getByRole('menu'))
          .getAllByRole('menuitem')
          .filter((item) => item.getAttribute('aria-current') === 'page')
          .map((item) => item.getAttribute('href')),
      ).toEqual([path]);
    },
  );

  it('offers the three things to write from "+"', async () => {
    const user = userEvent.setup();
    const nav = draw();

    await user.click(
      within(nav).getByRole('button', { name: 'Write something' }),
    );

    expect(
      screen
        .getAllByRole('menuitem')
        .map((item) => item.firstChild?.textContent),
    ).toEqual(['Ask for feedback', 'Give feedback', 'Give kudos']);
  });
});
