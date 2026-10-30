import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import { BrandNewSidebar } from './brand-new-sidebar';

const MEMBERSHIP = { workspace: { id: 'w-1', name: 'Acme' }, role: 'MEMBER' };

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
  '@/app/(signed-in)/(brand-new)/_lib/send-postcard-actions.service',
  () => ({ sendPostcardFeedback: vi.fn(), sendPostcardRequest: vi.fn() }),
);
const readMyAsks = vi.fn();
vi.mock('@/lib/feedback/my-asks.service', () => ({
  readMyAsks: (membership: unknown) => readMyAsks(membership),
}));
const readTeammates = vi.fn();
vi.mock('@/lib/feedback/teammates.service', () => ({
  readTeammates: (membership: unknown, ownEmail: string) =>
    readTeammates(membership, ownEmail),
}));

async function draw(waiting: number) {
  readTeammates.mockResolvedValue([]);
  readMyAsks.mockResolvedValue(
    Array.from({ length: waiting }, (_, index) => ({ askId: `a-${index}` })),
  );
  render(await BrandNewSidebar());
  return screen.getByRole('navigation', { name: 'Main' });
}

describe('BrandNewSidebar', () => {
  it('lists where to go in order, with Kudos board under Home and My Feedback over its three', async () => {
    const nav = await draw(0);

    expect(
      within(nav)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Home',
      'Kudos board',
      'Waiting for me',
      'Members',
      'My Feedback',
      'Received',
      'Given',
      'My requests',
    ]);
  });

  it('marks Home as the open page, and leads nowhere else yet', async () => {
    const nav = await draw(0);

    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      ROUTES.brandNewHome,
    );
    expect(within(nav).getAllByRole('link')).toHaveLength(1);
    for (const button of within(nav).getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('counts the Asks waiting for the person, in the Workspace they are in', async () => {
    const nav = await draw(3);

    expect(readMyAsks).toHaveBeenLastCalledWith(MEMBERSHIP);
    expect(
      within(nav).getByRole('button', { name: 'Waiting for me 3' }),
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
