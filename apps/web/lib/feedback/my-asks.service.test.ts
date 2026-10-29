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

const { readMyAsks } = await import('./my-asks.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as const;

/** The query the screen sent, so the test can prove it asked for the waiting ones. */
let askedFor: URLSearchParams | undefined;

function apiHolds(items: unknown[]) {
  askedFor = undefined;
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback-asks`,
      ({ request }) => {
        askedFor = new URL(request.url).searchParams;
        return HttpResponse.json({
          items,
          total: items.length,
          page: 1,
          pageSize: 100,
        });
      },
    ),
  );
}

const ONE_ASK = {
  askId: 'ask-1',
  feedbackRequestId: 'request-1',
  message: 'my presentation skills',
  requester: {
    accountId: 'account-ana',
    name: 'Ana Silva',
    status: 'ACTIVE',
    photoUrl: 'https://lh3.googleusercontent.com/a/account-ana=s96-c',
  },
  status: 'PENDING',
  createdAt: '2026-10-11T03:00:00.000Z',
};

describe('reading the Asks waiting for me', () => {
  it('reads who asked, about what, and when', async () => {
    apiHolds([ONE_ASK]);

    expect(await readMyAsks(MEMBERSHIP)).toEqual([
      {
        askId: 'ask-1',
        message: 'my presentation skills',
        requesterName: 'Ana Silva',
        requesterPhotoUrl:
          'https://lh3.googleusercontent.com/a/account-ana=s96-c',
        requesterInactive: false,
        askedAt: '2026-10-11T03:00:00.000Z',
        status: 'PENDING',
      },
    ]);
  });

  it('asks the API for the waiting ones rather than taking its default', async () => {
    apiHolds([ONE_ASK]);

    await readMyAsks(MEMBERSHIP);

    expect(askedFor?.get('status')).toBe('PENDING');
  });

  it('shows a Requester Deactivated in the Workspace as inactive', async () => {
    apiHolds([
      {
        ...ONE_ASK,
        requester: {
          accountId: 'account-ana',
          name: 'Ana Silva',
          status: 'DEACTIVATED',
        },
      },
    ]);

    const [ask] = await readMyAsks(MEMBERSHIP);

    expect(ask?.requesterInactive).toBe(true);
  });

  it('leaves the Requester unnamed while they have not introduced themselves', async () => {
    apiHolds([
      {
        ...ONE_ASK,
        requester: { accountId: 'account-ana', name: null, status: 'ACTIVE' },
      },
    ]);

    const [ask] = await readMyAsks(MEMBERSHIP);

    expect(ask?.requesterName).toBeNull();
  });

  it('reads an empty list as nothing waiting', async () => {
    apiHolds([]);

    expect(await readMyAsks(MEMBERSHIP)).toEqual([]);
  });
});
