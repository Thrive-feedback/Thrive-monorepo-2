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

const { readWorkspaceFeed } = await import('./workspace-feed.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as const;

const ONE_PIECE = {
  id: 'fb-1',
  origin: 'REQUESTED',
  feedbackRequestId: 'request-1',
  topic: 'running the planning meeting',
  giver: { accountId: 'account-ben', name: 'Ben Carter' },
  receiver: { accountId: 'account-cara', name: 'Cara Diaz' },
  body: 'You start with the three goals on one slide.',
  createdAt: '2026-10-12T03:00:00.000Z',
};

function apiHolds(items: unknown[]) {
  const asked: Request[] = [];
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feed`,
      ({ request }) => {
        asked.push(request);
        return HttpResponse.json({
          items,
          total: items.length,
          page: 1,
          pageSize: 100,
        });
      },
    ),
  );
  return asked;
}

describe('reading the Workspace feed', () => {
  it('reads who wrote it, who it is about, the Topic, the text and the day', async () => {
    apiHolds([ONE_PIECE]);

    expect(await readWorkspaceFeed(MEMBERSHIP)).toEqual([
      {
        id: 'fb-1',
        giverName: 'Ben Carter',
        receiverName: 'Cara Diaz',
        origin: 'REQUESTED',
        topic: 'running the planning meeting',
        body: 'You start with the three goals on one slide.',
        givenAt: '2026-10-12T03:00:00.000Z',
        reactions: {},
      },
    ]);
  });

  it('keeps the order the API answered in, which is newest first', async () => {
    apiHolds([
      { ...ONE_PIECE, id: 'fb-2', topic: 'the release notes' },
      ONE_PIECE,
    ]);

    const feed = await readWorkspaceFeed(MEMBERSHIP);

    expect(feed.map((feedback) => feedback.topic)).toEqual([
      'the release notes',
      'running the planning meeting',
    ]);
  });

  it('leaves somebody unnamed while they have not introduced themselves', async () => {
    apiHolds([
      {
        ...ONE_PIECE,
        giver: { accountId: 'account-ben', name: null },
        receiver: { accountId: 'account-cara', name: null },
      },
    ]);

    const feed = await readWorkspaceFeed(MEMBERSHIP);

    expect(feed[0]?.giverName).toBeNull();
    expect(feed[0]?.receiverName).toBeNull();
  });

  it('asks once, for one page of the signed-in person’s own Workspace', async () => {
    const asked = apiHolds([]);

    await readWorkspaceFeed(MEMBERSHIP);

    expect(asked).toHaveLength(1);
    expect(new URL(asked[0]?.url ?? '').searchParams.get('pageSize')).toBe(
      '100',
    );
  });

  it('sends the session on, because only a Member may read this feed', async () => {
    const asked = apiHolds([]);

    await readWorkspaceFeed(MEMBERSHIP);

    expect(asked[0]?.headers.get('cookie')).toBe('thrive.session_token=abc');
  });

  it('shows nothing when nobody has shared with everyone', async () => {
    apiHolds([]);

    expect(await readWorkspaceFeed(MEMBERSHIP)).toEqual([]);
  });
});
