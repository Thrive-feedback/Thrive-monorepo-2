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

const { readFeedbackAsk } = await import('./feedback-ask.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as const;
const ENDPOINT = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback-asks/${ASK_ID}`;

function apiHolds(requesterName: string | null, status = 'PENDING') {
  server.use(
    http.get(ENDPOINT, () =>
      HttpResponse.json({
        askId: ASK_ID,
        feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
        topic: 'Running the planning meeting',
        requester: {
          accountId: '0199a0f0-0000-7000-8000-00000000000a',
          name: requesterName,
        },
        status,
        createdAt: '2026-10-13T03:00:00.000Z',
      }),
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

describe('reading the Ask to answer', () => {
  it('reads who asked, what about, and where it stands', async () => {
    apiHolds('Ann Lee');

    expect(await readFeedbackAsk(MEMBERSHIP, ASK_ID)).toEqual({
      askId: ASK_ID,
      feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
      topic: 'Running the planning meeting',
      requesterName: 'Ann Lee',
      status: 'PENDING',
    });
  });

  it('leaves the Requester unnamed while they have not introduced themselves', async () => {
    apiHolds(null);

    const ask = await readFeedbackAsk(MEMBERSHIP, ASK_ID);

    expect(ask?.requesterName).toBeNull();
  });

  it('reads an already answered Ask, so the screen can say so', async () => {
    apiHolds('Ann Lee', 'ANSWERED');

    const ask = await readFeedbackAsk(MEMBERSHIP, ASK_ID);

    expect(ask?.status).toBe('ANSWERED');
  });

  it('answers nothing for an Ask that is not waiting for this person', async () => {
    apiRefuses('FEEDBACK_ASK_NOT_FOUND', 404);

    expect(await readFeedbackAsk(MEMBERSHIP, ASK_ID)).toBeNull();
  });

  it('answers nothing when the Workspace is not theirs either', async () => {
    apiRefuses('WORKSPACE_NOT_FOUND', 404);

    expect(await readFeedbackAsk(MEMBERSHIP, ASK_ID)).toBeNull();
  });

  it('stays loud when the API fails for a reason of its own', async () => {
    apiRefuses('SOMETHING_ELSE', 500);

    await expect(readFeedbackAsk(MEMBERSHIP, ASK_ID)).rejects.toThrow();
  });
});
