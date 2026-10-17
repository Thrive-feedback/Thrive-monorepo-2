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

const { readSentRequests } = await import('./sent-requests.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as const;

function apiHolds(items: unknown[]) {
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback-requests`,
      () =>
        HttpResponse.json({
          items,
          total: items.length,
          page: 1,
          pageSize: 100,
        }),
    ),
  );
}

describe('reading the Feedback Requests I sent', () => {
  it('reads the Topic, the day it was sent and where each Ask stands', async () => {
    apiHolds([
      {
        id: 'request-1',
        topic: 'my presentation skills',
        visibility: { value: 'ONLY_ME', selectedPeople: [] },
        createdAt: '2026-10-11T03:00:00.000Z',
        asks: [
          {
            askId: 'ask-1',
            giverAccountId: 'account-ben',
            giverName: 'Ben Carter',
            giverStatus: 'ACTIVE',
            status: 'PENDING',
          },
        ],
      },
    ]);

    expect(await readSentRequests(MEMBERSHIP)).toEqual([
      {
        id: 'request-1',
        topic: 'my presentation skills',
        sentAt: '2026-10-11T03:00:00.000Z',
        asks: [
          {
            askId: 'ask-1',
            giverName: 'Ben Carter',
            giverInactive: false,
            status: 'PENDING',
          },
        ],
      },
    ]);
  });

  it('leaves a Giver unnamed while they have not introduced themselves', async () => {
    apiHolds([
      {
        id: 'request-1',
        topic: 'my presentation skills',
        visibility: { value: 'ONLY_ME', selectedPeople: [] },
        createdAt: '2026-10-11T03:00:00.000Z',
        asks: [
          {
            askId: 'ask-1',
            giverAccountId: 'account-ben',
            giverName: null,
            giverStatus: 'ACTIVE',
            status: 'PENDING',
          },
        ],
      },
    ]);

    const [request] = await readSentRequests(MEMBERSHIP);

    expect(request?.asks[0]?.giverName).toBeNull();
  });

  it('reads an empty list as nothing sent yet', async () => {
    apiHolds([]);

    expect(await readSentRequests(MEMBERSHIP)).toEqual([]);
  });
});
