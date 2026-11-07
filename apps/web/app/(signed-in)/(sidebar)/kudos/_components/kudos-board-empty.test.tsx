import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { KudosBoardEmpty } = await import('./kudos-board-empty');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const SESSION = {
  email: 'ann@acme.test',
  photoUrl: null,
  profile: { displayName: 'Ann' },
  membership: {
    workspace: { id: WORKSPACE_ID, name: 'Acme' },
    role: 'MEMBER',
  },
} as Parameters<typeof KudosBoardEmpty>[0]['session'];

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

describe('KudosBoardEmpty', () => {
  it('offers to give the first Kudos on a board with none, in the Kudos colour', async () => {
    theApiHoldsNoTeammates();

    render(await KudosBoardEmpty({ session: SESSION, month: undefined }));

    expect(
      screen.getByRole('heading', { name: 'Nothing on the board yet' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Give kudos' })).toHaveClass(
      'bg-action-secondary',
    );
  });

  it('sends a month with none back to every month, and offers nothing to write', async () => {
    render(await KudosBoardEmpty({ session: SESSION, month: '2026-10' }));

    expect(
      screen.getByRole('heading', { name: /^Nothing here from/ }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'See every month' }),
    ).toHaveAttribute('href', '/kudos');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
