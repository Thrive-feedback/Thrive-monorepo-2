import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { ReceivedEmpty } = await import('./received-empty');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const SESSION = {
  email: 'ann@acme.test',
  photoUrl: null,
  profile: { displayName: 'Ann' },
  membership: {
    workspace: { id: WORKSPACE_ID, name: 'Acme' },
    role: 'MEMBER',
  },
} as Parameters<typeof ReceivedEmpty>[0]['session'];

function theApiHoldsNoTeammates() {
  const nothing = { items: [], total: 0, page: 1, pageSize: 100 };
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/members`, () =>
      HttpResponse.json(nothing),
    ),
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/workspace-goals`,
      () => HttpResponse.json(nothing),
    ),
  );
}

describe('ReceivedEmpty', () => {
  it.each([
    [
      'all',
      'No Feedback for you yet',
      'Ask for feedback',
      'bg-action-tertiary',
    ],
    [
      'requests',
      "You haven't asked anyone yet.",
      'Ask for feedback',
      'bg-action-tertiary',
    ],
    ['kudos', 'No Kudos for you yet.', 'Give kudos', 'bg-action-secondary'],
  ] as const)(
    'says what is missing when narrowed to %s, and offers the one card that fills it, in its colour',
    async (show, title, button, fill) => {
      theApiHoldsNoTeammates();

      render(await ReceivedEmpty({ session: SESSION, show }));

      expect(screen.getByRole('heading', { name: title })).toBeVisible();
      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(screen.getByRole('button', { name: button })).toHaveClass(fill);
    },
  );

  it('offers asking and giving, each in its colour, where nobody has given Feedback unasked', async () => {
    theApiHoldsNoTeammates();

    render(await ReceivedEmpty({ session: SESSION, show: 'offered' }));

    expect(
      screen.getByRole('heading', {
        name: 'Nobody has given you feedback unasked yet.',
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/You can give a teammate feedback unasked too\./),
    ).toBeVisible();
    const [ask, give] = screen.getAllByRole('button');
    expect(ask).toHaveAccessibleName('Ask for feedback');
    expect(ask).toHaveClass('bg-action-tertiary');
    expect(give).toHaveAccessibleName('Give feedback');
    expect(give).toHaveClass('bg-action-primary');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('keeps the blank cards it draws away from a screen reader', async () => {
    theApiHoldsNoTeammates();

    const { container } = render(
      await ReceivedEmpty({ session: SESSION, show: 'all' }),
    );

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
