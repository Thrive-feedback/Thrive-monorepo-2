import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsProvider } from '@/components/organisms/notifications-provider';
import type { BellNotification } from '@/lib/notifications/notification.type';
import { ROUTES } from '@/lib/routes.constant';
import { answerTheBell, unreadLines } from '@/lib/test/bell-notifications';
import { Sidebar } from './sidebar';
import { SidebarDrawer, SidebarDrawerTrigger } from './sidebar-drawer';

const MEMBERSHIP = { workspace: { id: 'w-1', name: 'Acme' }, role: 'MEMBER' };

const usePathname = vi.fn((): string => ROUTES.home);
vi.mock('next/navigation', () => ({
  usePathname: () => usePathname(),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/session/session.service', () => ({
  requireMember: async () => ({
    membership: MEMBERSHIP,
    email: 'ann@acme.test',
    name: 'Ann Lee',
    photoUrl: null,
    profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
  }),
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/_lib/send-postcard-actions.service',
  () => ({ sendPostcardFeedback: vi.fn(), sendPostcardRequest: vi.fn() }),
);
vi.mock('@/lib/feedback/workspace-goal-names.service', () => ({
  readWorkspaceGoalNames: async () => [],
}));
vi.mock(
  '@/lib/notifications/notification-actions.service',
  async () => (await import('@/lib/test/bell-notifications')).BELL_ACTIONS,
);
const readTeammates = vi.fn();
vi.mock('@/lib/feedback/teammates.service', () => ({
  readTeammates: (membership: unknown, ownEmail: string) =>
    readTeammates(membership, ownEmail),
}));

vi.mock('@/app/(signed-in)/(sidebar)/_lib/one-on-ones.service', () => ({
  readOneOnOnesToAnswer: async () => oneOnOnesToAnswer,
}));
let oneOnOnesToAnswer = 0;

const readFeatureFlags = vi.fn();
vi.mock('@/lib/feature-flags/feature-flags.service', () => ({
  readFeatureFlags: () => readFeatureFlags(),
}));

async function draw(
  waiting: number,
  path: string = ROUTES.home,
  showsDashboard = true,
  extra: BellNotification[] = [],
) {
  usePathname.mockReturnValue(path);
  readTeammates.mockResolvedValue([]);
  readFeatureFlags.mockResolvedValue({ showsDashboard });
  answerTheBell([...unreadLines('ASK_RECEIVED', waiting), ...extra]);
  const drawn = await Sidebar();
  render(
    <NotificationsProvider>
      <SidebarDrawer>
        <SidebarDrawerTrigger />
        {drawn}
      </SidebarDrawer>
    </NotificationsProvider>,
  );
  return within(sidebar()).getByRole('navigation', { name: 'Main' });
}

/** The column beside the page; a phone's menu drawer holds the same, once opened. */
function sidebar() {
  return screen.getByRole('complementary', { name: 'Sidebar' });
}

describe('Sidebar', () => {
  it('lists where to go in order, with Kudos board under Home, My Feedback over Received and Given, and Tools over 1:1s', async () => {
    const nav = await draw(0);

    expect(
      within(nav)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Home',
      'Kudos board',
      'Waiting for me',
      'Teammates',
      'My Feedback',
      'Your dashboard',
      'Received',
      'Given',
      'Tools',
      '1:1s',
    ]);
  });

  it('keeps Your dashboard in both menus as Coming soon, not a link, where the deployment has switched it off', async () => {
    const user = userEvent.setup();
    const nav = await draw(0, ROUTES.home, false);

    expect(
      within(nav)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Home',
      'Kudos board',
      'Waiting for me',
      'Teammates',
      'My Feedback',
      'Your dashboardComing soon',
      'Received',
      'Given',
      'Tools',
      '1:1s',
    ]);
    expect(
      within(nav).queryByRole('link', { name: /Your dashboard/ }),
    ).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const drawer = within(
      within(screen.getByRole('dialog', { name: 'Menu' })).getByRole(
        'navigation',
        { name: 'Main' },
      ),
    );
    expect(drawer.getByText('Coming soon')).toBeInTheDocument();
    expect(drawer.queryByRole('link', { name: /Your dashboard/ })).toBeNull();
  });

  it('marks the page that is open, wherever the person went', async () => {
    const nav = await draw(0, ROUTES.waiting);

    expect(
      within(nav).getByRole('link', { name: 'Waiting for me' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks Home as the open page, and leads everywhere it lists, Teammates included', async () => {
    const nav = await draw(0);

    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      ROUTES.home,
    );
    expect(
      within(nav).getByRole('link', { name: 'Waiting for me' }),
    ).toHaveAttribute('href', ROUTES.waiting);
    expect(
      within(nav).getByRole('link', { name: 'Kudos board' }),
    ).toHaveAttribute('href', ROUTES.kudos);
    expect(within(nav).getByRole('link', { name: 'Received' })).toHaveAttribute(
      'href',
      ROUTES.received,
    );
    expect(within(nav).getByRole('link', { name: 'Given' })).toHaveAttribute(
      'href',
      ROUTES.given,
    );
    expect(
      within(nav).getByRole('link', { name: 'Your dashboard' }),
    ).toHaveAttribute('href', ROUTES.dashboard);
    expect(
      within(nav).getByRole('link', { name: 'Teammates' }),
    ).toHaveAttribute('href', ROUTES.teammates);
    expect(within(nav).getByRole('link', { name: '1:1s' })).toHaveAttribute(
      'href',
      ROUTES.oneOnOnes,
    );
    expect(within(nav).getAllByRole('link')).toHaveLength(8);
    expect(within(nav).queryByRole('button')).not.toBeInTheDocument();
  });

  it('counts the 1:1s waiting on the person’s answer beside 1:1s', async () => {
    oneOnOnesToAnswer = 2;
    const nav = await draw(0);
    oneOnOnesToAnswer = 0;

    expect(
      within(nav).getByRole('link', { name: /^1:1s ?, 2 to answer$/ }),
    ).toHaveAttribute('href', ROUTES.oneOnOnes);
  });

  it('counts the unread Asks in the bell beside Waiting for me, in red', async () => {
    const nav = await draw(3);

    const waiting = await within(nav).findByRole('link', {
      name: /^Waiting for me ?, 3 unread$/,
    });
    expect(within(waiting).getByText('3')).toHaveClass('bg-attention');
  });

  it('draws a count past ninety-nine as 99+, and says the real number', async () => {
    const nav = await draw(120);

    const waiting = await within(nav).findByRole('link', {
      name: /^Waiting for me ?, 120 unread$/,
    });
    expect(within(waiting).getByText('99+')).toBeVisible();
  });

  it('counts what Received holds of the bell beside Received: answers, Feedback and Kudos', async () => {
    const nav = await draw(0, ROUTES.home, true, [
      ...unreadLines('ASK_ANSWERED', 1),
      ...unreadLines('FEEDBACK_RECEIVED', 1),
      ...unreadLines('KUDOS_RECEIVED', 2),
      // Read on Home, so not Received's to count.
      ...unreadLines('FEEDBACK_SHARED', 1),
    ]);

    expect(
      await within(nav).findByRole('link', {
        name: /^Received ?, 4 unread$/,
      }),
    ).toBeVisible();
  });

  it('offers "+" to write something above the menu', async () => {
    await draw(0);

    expect(
      within(sidebar()).getByRole('button', { name: 'Write something' }),
    ).toBeVisible();
  });

  it('keeps every place named on a Settings page, marks Settings open, and names a place pointed at', async () => {
    const user = userEvent.setup();
    const nav = await draw(2, ROUTES.settings.index);
    await within(nav).findByRole('link', {
      name: /^Waiting for me ?, 2 unread$/,
    });

    expect(
      within(nav)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Home',
      'Kudos board',
      'Waiting for me2, 2 unread',
      'Teammates',
      'My Feedback',
      'Your dashboard',
      'Received',
      'Given',
      'Tools',
      '1:1s',
    ]);
    expect(
      within(sidebar()).getByRole('link', { name: 'Settings' }),
    ).toHaveAttribute('aria-current', 'page');

    await user.hover(within(nav).getByRole('link', { name: 'Kudos board' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Kudos board');
  });

  it('reads who a postcard can be for: the Workspace without the person', async () => {
    await draw(0);

    expect(readTeammates).toHaveBeenLastCalledWith(MEMBERSHIP, 'ann@acme.test');
  });
});
