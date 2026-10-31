import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock(
  '@/app/(signed-in)/(brand-new)/brand-new-waiting/_lib/waiting-asks-actions.service',
  () => ({ readNextWaitingAsks: vi.fn() }),
);

const { WaitingAsks } = await import('./waiting-asks');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as CurrentMembership;

const AN_ASK = {
  askId: '0199a0f0-0000-7000-8000-0000000000a1',
  feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
  message: 'Asked by Ben',
  tags: { workspaceGoals: [], mentions: [] },
  requester: {
    accountId: 'ben',
    name: 'Ben',
    photoUrl: null,
    status: 'ACTIVE',
  },
  status: 'PENDING',
  createdAt: '2026-10-31T03:00:00.000Z',
  onWorkspaceFeed: true,
};

/** What the screen asked for, so the test can prove it read the order chosen. */
let askedFor: URLSearchParams | undefined;

function apiHolds(items: unknown[]) {
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/waiting-asks`,
      ({ request }) => {
        askedFor = new URL(request.url).searchParams;
        return HttpResponse.json({ items, nextCursor: null });
      },
    ),
  );
}

describe('WaitingAsks', () => {
  it('says so when nothing is waiting', async () => {
    apiHolds([]);

    render(await WaitingAsks({ membership: MEMBERSHIP, sort: 'oldest' }));

    expect(screen.getByText('Nothing is waiting for you.')).toBeVisible();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('reads the first page of the Workspace the person is in, in that order', async () => {
    apiHolds([AN_ASK]);

    render(await WaitingAsks({ membership: MEMBERSHIP, sort: 'oldest' }));

    expect(askedFor?.get('sort')).toBe('OLDEST');
    expect(askedFor?.has('cursor')).toBe(false);
    expect(screen.getByText('Asked by Ben')).toBeVisible();
  });
});
