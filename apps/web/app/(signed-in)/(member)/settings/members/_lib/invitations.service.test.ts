/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs: in jsdom, MSW would keep a browser cookie jar
 * and send one test's cookies with the next test's requests.
 */
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { readInvitations } = await import('./invitations.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

function invitationFrom(invitedBy: {
  email: string;
  displayName: string | null;
}) {
  return {
    invitationId: '0199a0f0-0000-7000-8000-000000000003',
    email: 'cat@acme.test',
    role: 'MEMBER',
    status: 'PENDING',
    invitedAt: '2026-10-06T03:00:00.000Z',
    expiresAt: '2026-10-13T03:00:00.000Z',
    invitedBy,
  };
}

function apiHolds(item: ReturnType<typeof invitationFrom>) {
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/invitations`,
      () =>
        HttpResponse.json({ total: 1, page: 1, pageSize: 100, items: [item] }),
    ),
  );
}

const OWNER = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'OWNER',
} as const;

describe('reading the open Invitations for Members', () => {
  it('names who sent each by their Display name, with when it was sent and expires', async () => {
    apiHolds(invitationFrom({ email: 'ann@acme.test', displayName: 'Ann' }));

    expect(await readInvitations(OWNER)).toEqual([
      {
        invitationId: '0199a0f0-0000-7000-8000-000000000003',
        email: 'cat@acme.test',
        status: 'PENDING',
        invitedBy: 'Ann',
        invitedAt: '2026-10-06T03:00:00.000Z',
        expiresAt: '2026-10-13T03:00:00.000Z',
      },
    ]);
  });

  it('names a sender who has not introduced themselves by their address', async () => {
    apiHolds(invitationFrom({ email: 'ann@acme.test', displayName: null }));

    expect((await readInvitations(OWNER))[0]?.invitedBy).toBe('ann@acme.test');
  });
});
