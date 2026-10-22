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

const { readGivenFeedback } = await import('./given-feedback.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as const;

const NO_TAGS = { workspaceGoals: [], mentions: [] };

const ONE_PIECE = {
  id: 'fb-1',
  origin: 'OFFERED',
  feedbackRequestId: null,
  topic: 'the customer demo',
  topicTags: NO_TAGS,
  giver: { accountId: 'account-ann', name: 'Ann Lee', status: 'ACTIVE' },
  receiver: { accountId: 'account-cara', name: 'Cara Diaz', status: 'ACTIVE' },
  body: 'You kept the room with you.',
  tags: NO_TAGS,
  createdAt: '2026-10-12T03:00:00.000Z',
};

function apiHolds(items: unknown[]) {
  const asked: Request[] = [];
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/given-feedback`,
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

describe('reading the Feedback I have given', () => {
  it('reads whom it was for, the Topic, the text and the day', async () => {
    apiHolds([ONE_PIECE]);

    expect(await readGivenFeedback(MEMBERSHIP)).toEqual([
      {
        id: 'fb-1',
        topic: 'the customer demo',
        topicTags: NO_TAGS,
        offered: true,
        receiverName: 'Cara Diaz',
        receiverInactive: false,
        body: 'You kept the room with you.',
        bodyTags: NO_TAGS,
        writtenAt: '2026-10-12T03:00:00.000Z',
      },
    ]);
  });

  it('tells an answer from Feedback given without being asked', async () => {
    apiHolds([
      {
        ...ONE_PIECE,
        origin: 'REQUESTED',
        feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
      },
    ]);

    const given = await readGivenFeedback(MEMBERSHIP);

    expect(given[0]?.offered).toBe(false);
  });

  it('shows a Receiver who was Deactivated as inactive', async () => {
    apiHolds([
      {
        ...ONE_PIECE,
        receiver: {
          accountId: 'account-cara',
          name: 'Cara Diaz',
          status: 'DEACTIVATED',
        },
      },
    ]);

    const given = await readGivenFeedback(MEMBERSHIP);

    expect(given[0]?.receiverInactive).toBe(true);
  });

  it('keeps the order the API answered in, which is newest first', async () => {
    apiHolds([
      { ...ONE_PIECE, id: 'fb-2', topic: 'the release notes' },
      ONE_PIECE,
    ]);

    const given = await readGivenFeedback(MEMBERSHIP);

    expect(given.map((feedback) => feedback.topic)).toEqual([
      'the release notes',
      'the customer demo',
    ]);
  });

  it('sends the session on, because the API decides whose list this is', async () => {
    const asked = apiHolds([]);

    await readGivenFeedback(MEMBERSHIP);

    expect(asked).toHaveLength(1);
    expect(asked[0]?.headers.get('cookie')).toBe('thrive.session_token=abc');
  });
});
