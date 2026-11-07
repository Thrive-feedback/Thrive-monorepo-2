import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { KudosBoardGive, KudosBoardGiveSkeleton } = await import(
  './kudos-board-give'
);

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const SESSION = {
  email: 'ann@acme.test',
  photoUrl: null,
  profile: { displayName: 'Ann' },
  membership: {
    workspace: { id: WORKSPACE_ID, name: 'Acme' },
    role: 'MEMBER',
  },
} as Parameters<typeof KudosBoardGive>[0]['session'];

function theApiHolds(kudosOnTheBoard: number) {
  const nothing = { items: [], total: 0, page: 1, pageSize: 100 };
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/kudos/months`,
      () => HttpResponse.json({ total: kudosOnTheBoard, months: [] }),
    ),
    http.get(`${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/members`, () =>
      HttpResponse.json(nothing),
    ),
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/workspace-goals`,
      () => HttpResponse.json(nothing),
    ),
  );
}

describe('KudosBoardGive', () => {
  it('offers to give a Kudos from the head of a board with some on it, in the Kudos colour', async () => {
    theApiHolds(3);

    render(await KudosBoardGive({ session: SESSION }));

    expect(screen.getByRole('button', { name: 'Give kudos' })).toHaveClass(
      'bg-action-secondary',
    );
  });

  it('waits for the first Kudos, since an empty board offers the same in its empty state', async () => {
    theApiHolds(0);

    const { container } = render(await KudosBoardGive({ session: SESSION }));

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('holds a button’s room while it reads, offering nothing to press', () => {
    const { container } = render(<KudosBoardGiveSkeleton />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('h-10');
  });
});
