import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from './_lib/profile.type';
import ProfilePage from './page';

const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000d1';
const BEN_ID = '0199a0f0-0000-7000-8000-0000000000b1';

const ANN_SESSION = {
  email: 'ann@acme.test',
  name: 'Ann Google',
  photoUrl: null,
  profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
  membership: { workspace: { id: 'w-1', name: 'Acme' }, role: 'ADMIN' },
};

const ANN: Profile = {
  accountId: '0199a0f0-0000-7000-8000-0000000000a1',
  slug: 'ann',
  name: 'Ann',
  fullName: 'Ann Lee',
  email: 'ann@acme.test',
  photoUrl: null,
  role: 'ADMIN',
  isDeactivated: false,
  joinedAt: '2026-10-02T03:04:05.000Z',
};

const BEN: Profile = {
  accountId: BEN_ID,
  slug: 'ben',
  name: 'Ben',
  fullName: 'Ben Carter',
  email: 'ben@acme.test',
  photoUrl: null,
  role: 'MEMBER',
  isDeactivated: false,
  joinedAt: '2026-10-11T03:04:05.000Z',
};

// The cards Give, Ask and Kudos open send through server actions, which the page never calls here.
vi.mock('server-only', () => ({}));
const requireMember = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
}));
const readProfile = vi.fn();
vi.mock('./_lib/profile.service', () => ({
  readProfile: (...args: unknown[]) => readProfile(...args),
}));
vi.mock('@/lib/feedback/teammates.service', () => ({
  readTeammates: async () => [
    {
      accountId: BEN_ID,
      name: 'Ben',
      email: 'ben@acme.test',
      photoUrl: null,
      slug: 'ben',
      displayName: 'Ben',
    },
  ],
}));
vi.mock('@/lib/feedback/workspace-goal-names.service', () => ({
  readWorkspaceGoalNames: async () => [],
}));
const push = vi.fn();
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('notFound');
  }),
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('./_components/profile-items', () => ({
  ProfileItems: ({ show }: { show: string }) => <p>The {show} list</p>,
}));
vi.mock('@/app/(signed-in)/(sidebar)/_components/feedback-postcard', () => ({
  FeedbackPostcard: ({
    feedbackId,
    closeHref,
  }: {
    feedbackId: string;
    closeHref: string;
  }) => (
    <p>
      The postcard {feedbackId}, closing to {closeHref}
    </p>
  ),
}));

beforeEach(() => {
  requireMember.mockResolvedValue(ANN_SESSION);
  readProfile.mockImplementation(
    async (_membership: unknown, slug: string) =>
      ({ ann: ANN, ben: BEN })[slug] ?? null,
  );
});

function open(slug: string, searchParams: Record<string, string> = {}) {
  return ProfilePage({
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve(searchParams),
  });
}

describe('Profile', () => {
  it('is headed by the name the person goes by, their full name under it, then their address, without their Role or when they joined', async () => {
    render(await open('ben'));

    const heading = screen.getByRole('heading', { level: 1, name: 'Ben' });
    const fullName = screen.getByText('Ben Carter');
    const email = screen.getByText('ben@acme.test');
    expect(heading.compareDocumentPosition(fullName)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(fullName.compareDocumentPosition(email)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.queryByText(/^Joined/)).not.toBeInTheDocument();
    expect(screen.queryByText('Member')).not.toBeInTheDocument();
  });

  it('on the reader’s own, says You and leads to their Account, with nothing to write to themselves', async () => {
    render(await open('ann'));

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Account settings' }),
    ).toHaveAttribute('href', '/settings/account');
    expect(
      screen.queryByRole('button', { name: /^(Give|Ask) Ann/ }),
    ).not.toBeInTheDocument();
  });

  it('on a teammate’s, offers Give, Ask and Kudos for them', async () => {
    render(await open('ben'));

    for (const name of [
      'Give Ben feedback',
      'Ask Ben for feedback',
      'Give Ben kudos',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.queryByText('You')).not.toBeInTheDocument();
  });

  it('marks someone who has left as Deactivated, and offers nothing to write to them', async () => {
    readProfile.mockResolvedValue({ ...BEN, isDeactivated: true });

    render(await open('ben'));

    expect(screen.getByText('Deactivated')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Give Ben feedback' }),
    ).not.toBeInTheDocument();
  });

  it('is not found for a slug nobody in the Workspace holds', async () => {
    await expect(open('nobody')).rejects.toThrow('notFound');
  });

  it('is not found, unread, for a slug no Profile could hold', async () => {
    await expect(open('a'.repeat(65))).rejects.toThrow('notFound');
    expect(readProfile).not.toHaveBeenCalled();
  });

  it('opens on the Feedback, with what everyone sees and what is for the reader as two titled groups of chips', async () => {
    render(await open('ben'));

    const everyone = screen.getByRole('group', { name: 'Everyone sees' });
    const forYou = screen.getByRole('group', { name: 'For you' });
    expect([
      within(everyone)
        .getAllByRole('button')
        .map((chip) => [chip.textContent, chip.getAttribute('aria-pressed')]),
      // The chips, which press; the "i" beside the title is a button too, but none of them.
      within(forYou)
        .getAllByRole('button')
        .filter((chip) => chip.hasAttribute('aria-pressed'))
        .map((chip) => [chip.textContent, chip.getAttribute('aria-pressed')]),
      screen.getByText('The feedback list') !== null,
    ]).toEqual([
      [
        ['Feedback', 'true'],
        ['Kudos', 'false'],
      ],
      [
        ['Between you two', 'false'],
        ['Shared with you', 'false'],
        ['Open asks', 'false'],
      ],
      true,
    ]);
  });

  it('sets For you apart as a group of its own, saying behind an “i” that it differs for each reader', async () => {
    render(await open('ben'));

    const forYou = screen.getByRole('group', { name: 'For you' });
    expect(forYou).not.toHaveAccessibleDescription();
    expect(
      within(forYou).getByRole('button', { name: 'About For you' }),
    ).toHaveAccessibleDescription(
      'This part is different for everyone who opens it.',
    );
  });

  it('goes to the list a chip names when it is pressed', async () => {
    const user = userEvent.setup();
    render(await open('ben'));

    await user.click(screen.getByRole('button', { name: 'Kudos' }));

    expect(push).toHaveBeenCalledWith('/profile/ben?show=kudos');
  });

  it.each([
    ['between', 'Between you two'],
    ['shared', 'Shared with you'],
    ['asks', 'Open asks'],
  ])(
    'on a teammate’s, opens the %s list for the reader',
    async (show, name) => {
      render(await open('ben', { show }));

      expect([
        screen.getByRole('button', { name }).getAttribute('aria-pressed'),
        screen.getByText(`The ${show} list`) !== null,
      ]).toEqual(['true', true]);
    },
  );

  it('on the reader’s own, is a mirror of what everyone sees, with nothing for them alone', async () => {
    render(await open('ann'));

    expect([
      screen.queryByRole('group', { name: 'For you' }),
      screen.getByRole('group', { name: 'Everyone sees' }),
    ]).toEqual([null, expect.anything()]);
    expect(
      screen.getByRole('group', { name: 'Everyone sees' }),
    ).toHaveAccessibleDescription(
      'This is what everyone sees on your Profile.',
    );
  });

  it.each(['between', 'shared', 'asks'])(
    'on the reader’s own, opens on the Feedback when asked for the %s list',
    async (show) => {
      render(await open('ann', { show }));

      expect(screen.getByText('The feedback list')).toBeInTheDocument();
    },
  );

  it('shows the list the address names', async () => {
    render(await open('ben', { show: 'kudos' }));

    expect(screen.getByRole('button', { name: 'Kudos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('The kudos list')).toBeInTheDocument();
  });

  it('opens the piece the address names, closing back to the list it was opened over', async () => {
    render(await open('ben', { show: 'kudos', feedback: FEEDBACK_ID }));

    expect(
      screen.getByText(
        `The postcard ${FEEDBACK_ID}, closing to /profile/ben?show=kudos`,
      ),
    ).toBeInTheDocument();
  });
});
