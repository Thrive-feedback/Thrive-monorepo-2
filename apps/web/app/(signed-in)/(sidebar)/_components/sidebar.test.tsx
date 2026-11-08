import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import { Sidebar } from './sidebar';

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
const readWaitingCount = vi.fn();
vi.mock('@/lib/feedback/waiting-count.service', () => ({
  readWaitingCount: (membership: unknown) => readWaitingCount(membership),
}));
const readTeammates = vi.fn();
vi.mock('@/lib/feedback/teammates.service', () => ({
  readTeammates: (membership: unknown, ownEmail: string) =>
    readTeammates(membership, ownEmail),
}));

async function draw(waiting: number, path: string = ROUTES.home) {
  usePathname.mockReturnValue(path);
  readTeammates.mockResolvedValue([]);
  readWaitingCount.mockResolvedValue(waiting);
  render(await Sidebar());
  return screen.getByRole('navigation', { name: 'Main' });
}

describe('Sidebar', () => {
  it('lists where to go in order, with Kudos board under Home and My Feedback over Received and Given', async () => {
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
    ]);
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

  it('marks Home as the open page, and leads to Waiting for me and the Kudos board', async () => {
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
    expect(within(nav).getAllByRole('link')).toHaveLength(6);
    for (const button of within(nav).getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('counts the Asks waiting for the person, in the Workspace they are in', async () => {
    const nav = await draw(3);

    expect(readWaitingCount).toHaveBeenLastCalledWith(MEMBERSHIP);
    expect(
      within(nav).getByRole('link', { name: 'Waiting for me 3' }),
    ).toBeVisible();
  });

  it('offers "+" to write something above the menu', async () => {
    await draw(0);

    expect(
      screen.getByRole('button', { name: 'Write something' }),
    ).toBeVisible();
  });

  it('reads who a postcard can be for: the Workspace without the person', async () => {
    await draw(0);

    expect(readTeammates).toHaveBeenLastCalledWith(MEMBERSHIP, 'ann@acme.test');
  });
});
