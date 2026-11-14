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
  it('lists Home, the Kudos board, "+", Waiting for me and My Feedback, in that order', () => {
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
      'My Feedback',
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

  it('marks the page that is open, and My Feedback on Received or Given', () => {
    const nav = draw(ROUTES.kudos);

    expect(
      within(nav).getByRole('link', { name: 'Kudos board' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(
      within(nav).getByRole('button', { name: 'My Feedback' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('opens Received and Given from My Feedback, marking the one open', async () => {
    const user = userEvent.setup();
    const nav = draw(ROUTES.given);
    const myFeedback = within(nav).getByRole('button', { name: 'My Feedback' });

    expect(myFeedback).toHaveAttribute('aria-current', 'page');

    await user.click(myFeedback);

    const menu = screen.getByRole('menu');
    expect(
      within(menu).getByRole('menuitem', { name: 'Received' }),
    ).toHaveAttribute('href', ROUTES.received);
    expect(
      within(menu).getByRole('menuitem', { name: 'Given' }),
    ).toHaveAttribute('aria-current', 'page');
  });

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
