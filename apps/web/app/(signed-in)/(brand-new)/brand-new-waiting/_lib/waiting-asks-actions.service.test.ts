/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES } from '@/lib/routes.constant';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

const readCurrentMembership = vi.fn();
vi.mock('@/lib/session/session.service', () => ({
  readCurrentMembership: () => readCurrentMembership(),
}));

/** `redirect` works by throwing, so the fake does too, carrying where it went. */
class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirected to ${to}`);
  }
}
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Redirected(to);
  },
}));

const { readNextWaitingAsks } = await import('./waiting-asks-actions.service');

const WAITING_ASKS = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/waiting-asks`;

const AN_ASK = {
  askId: '0199a0f0-0000-7000-8000-0000000000a1',
  feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
  message: 'How clear was the plan?',
  tags: { workspaceGoals: [], mentions: [] },
  requester: {
    accountId: 'ann',
    name: 'Ann Lee',
    photoUrl: null,
    status: 'ACTIVE',
  },
  status: 'PENDING',
  createdAt: '2026-10-31T03:00:00.000Z',
  onWorkspaceFeed: true,
};

beforeEach(() => {
  readCurrentMembership.mockReset().mockResolvedValue({
    workspace: { id: WORKSPACE_ID, name: 'Acme' },
    role: 'MEMBER',
  });
});

describe('readNextWaitingAsks', () => {
  it.each([
    ['newest', 'NEWEST'],
    ['oldest', 'OLDEST'],
  ] as const)(
    'asks for the page after the cursor, %s first',
    async (sort, apiSort) => {
      let asked: URL | undefined;
      server.use(
        http.get(WAITING_ASKS, ({ request }) => {
          asked = new URL(request.url);
          return HttpResponse.json({ items: [], nextCursor: null });
        }),
      );

      await readNextWaitingAsks({ sort, cursor: 'cursor-1' });

      expect(asked?.searchParams.get('sort')).toBe(apiSort);
      expect(asked?.searchParams.get('cursor')).toBe('cursor-1');
      expect(asked?.searchParams.get('limit')).toBe('20');
    },
  );

  it('hands back each Ask as a card shows it', async () => {
    server.use(
      http.get(WAITING_ASKS, () =>
        HttpResponse.json({ items: [AN_ASK], nextCursor: 'cursor-2' }),
      ),
    );

    const page = await readNextWaitingAsks({
      sort: 'newest',
      cursor: 'cursor-1',
    });

    expect(page?.nextCursor).toBe('cursor-2');
    expect(page?.items[0]).toMatchObject({
      askId: AN_ASK.askId,
      message: AN_ASK.message,
      requesterName: 'Ann Lee',
      requesterInactive: false,
      askedAt: AN_ASK.createdAt,
    });
  });

  it.each([
    [{ sort: 'sideways', cursor: 'cursor-1' }],
    [{ sort: 'newest', cursor: '' }],
    [{ sort: 'newest' }],
    ['nonsense'],
  ])(
    'reads nothing for what the page could not have sent: %j',
    async (input) => {
      expect(await readNextWaitingAsks(input)).toBeNull();
      expect(readCurrentMembership).not.toHaveBeenCalled();
    },
  );

  it('answers null when the API refuses, so the list can offer to try again', async () => {
    server.use(
      http.get(WAITING_ASKS, () =>
        HttpResponse.json(
          { error: { code: 'REQUEST_INVALID', message: 'Not a cursor.' } },
          { status: 400 },
        ),
      ),
    );

    expect(
      await readNextWaitingAsks({ sort: 'newest', cursor: 'cursor-1' }),
    ).toBeNull();
  });

  it('sends somebody whose session has gone to sign in', async () => {
    readCurrentMembership.mockResolvedValue(null);

    await expect(
      readNextWaitingAsks({ sort: 'newest', cursor: 'cursor-1' }),
    ).rejects.toMatchObject({ to: ROUTES.signIn });
  });
});
