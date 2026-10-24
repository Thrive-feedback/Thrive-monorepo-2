/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { readFeedback } = await import('./feedback.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000b1';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as const;
const ENDPOINT = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback/${FEEDBACK_ID}`;

const NO_TAGS = { workspaceGoals: [], mentions: [] };

const FEEDBACK_AS_STORED = {
  id: FEEDBACK_ID,
  origin: 'OFFERED',
  feedbackRequestId: null,
  giver: {
    accountId: '0199a0f0-0000-7000-8000-00000000000a',
    name: 'Ann Lee' as string | null,
    status: 'ACTIVE',
  },
  receiver: {
    accountId: '0199a0f0-0000-7000-8000-00000000000b',
    name: 'Ben Ooi' as string | null,
    status: 'ACTIVE',
  },
  message: 'You ran the planning meeting well',
  tags: NO_TAGS,
  createdAt: '2026-10-13T03:00:00.000Z',
};

function apiHolds(overrides: Partial<typeof FEEDBACK_AS_STORED> = {}) {
  server.use(
    http.get(ENDPOINT, () =>
      HttpResponse.json({ ...FEEDBACK_AS_STORED, ...overrides }),
    ),
  );
}

function apiRefuses(code: string, status: number) {
  server.use(
    http.get(ENDPOINT, () =>
      HttpResponse.json(
        { error: { code, message: code, correlationId: 'test' } },
        { status },
      ),
    ),
  );
}

describe('reading one piece of Feedback', () => {
  it('reads who wrote it to whom, whether it was asked for, and what it says', async () => {
    apiHolds({ origin: 'REQUESTED' });

    expect(await readFeedback(MEMBERSHIP, FEEDBACK_ID)).toEqual({
      id: FEEDBACK_ID,
      giverName: 'Ann Lee',
      giverInactive: false,
      receiverName: 'Ben Ooi',
      receiverInactive: false,
      origin: 'REQUESTED',
      message: 'You ran the planning meeting well',
      messageTags: NO_TAGS,
      givenAt: '2026-10-13T03:00:00.000Z',
      reactions: {},
    });
  });

  it('leaves either side unnamed while they have not introduced themselves', async () => {
    apiHolds({
      giver: { ...FEEDBACK_AS_STORED.giver, name: null },
      receiver: { ...FEEDBACK_AS_STORED.receiver, name: null },
    });

    const feedback = await readFeedback(MEMBERSHIP, FEEDBACK_ID);

    expect(feedback?.giverName).toBeNull();
    expect(feedback?.receiverName).toBeNull();
  });

  it('marks a Deactivated Member as inactive, keeping what they wrote', async () => {
    apiHolds({
      giver: { ...FEEDBACK_AS_STORED.giver, status: 'DEACTIVATED' },
      receiver: { ...FEEDBACK_AS_STORED.receiver, status: 'DEACTIVATED' },
    });

    const feedback = await readFeedback(MEMBERSHIP, FEEDBACK_ID);

    expect(feedback?.giverInactive).toBe(true);
    expect(feedback?.receiverInactive).toBe(true);
    expect(feedback?.message).toBe('You ran the planning meeting well');
  });

  it('answers nothing for Feedback this person may not read', async () => {
    apiRefuses('FEEDBACK_NOT_FOUND', 404);

    expect(await readFeedback(MEMBERSHIP, FEEDBACK_ID)).toBeNull();
  });

  it('answers nothing when the Workspace is not theirs either', async () => {
    apiRefuses('WORKSPACE_NOT_FOUND', 404);

    expect(await readFeedback(MEMBERSHIP, FEEDBACK_ID)).toBeNull();
  });

  it('stays loud when the API fails for a reason of its own', async () => {
    apiRefuses('SOMETHING_ELSE', 500);

    await expect(readFeedback(MEMBERSHIP, FEEDBACK_ID)).rejects.toThrow();
  });
});
