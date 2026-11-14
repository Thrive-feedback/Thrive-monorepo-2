import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
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

function draw(path: string = ROUTES.home, waitingCount = 0) {
  usePathname.mockReturnValue(path);
  render(
    <TabBar waitingCount={waitingCount}>
      <ComposeMenu
        workspaceId="workspace-acme"
        teammates={[]}
        workspaceGoals={[]}
        writer={{ name: 'Ann', photoUrl: null }}
        placement="tab-bar"
      />
    </TabBar>,
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

  it('reads the count of Asks waiting after Waiting for me, as the sidebar does', () => {
    const nav = draw(ROUTES.home, 3);

    expect(
      within(nav).getByRole('link', { name: 'Waiting for me 3' }),
    ).toBeVisible();
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
