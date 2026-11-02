import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { GivenEmpty } = await import('./given-empty');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const SESSION = {
  email: 'ann@acme.test',
  photoUrl: null,
  profile: { displayName: 'Ann' },
  membership: {
    workspace: { id: WORKSPACE_ID, name: 'Acme' },
    role: 'MEMBER',
  },
} as Parameters<typeof GivenEmpty>[0]['session'];

function theApiHoldsNothing() {
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

describe('GivenEmpty', () => {
  it('says nothing was given yet, and offers a way to give something', async () => {
    theApiHoldsNothing();

    render(await GivenEmpty({ session: SESSION }));

    expect(
      screen.getByText("You haven't given any Feedback yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Give feedback' }),
    ).toBeInTheDocument();
  });
});
