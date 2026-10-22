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

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';
const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000e1';
const WRITTEN = 'You lose the room at the detail.';

const requireMember = vi.fn(async (_workspaceId: string) => ({
  email: 'ben@acme.test',
  membership: { workspace: { id: WORKSPACE_ID, name: 'Acme' }, role: 'MEMBER' },
}));
vi.mock('@/lib/session/session.service', () => ({
  requireMemberOf: (workspaceId: string) => requireMember(workspaceId),
}));

/** `redirect` works by throwing, so the fake does too. */
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

const { answerAsk } = await import('./answer-ask-actions.service');

const ENDPOINT = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback-asks/${ASK_ID}/answers`;

function answering(message: string, askId = ASK_ID) {
  const formData = new FormData();
  formData.set('askId', askId);
  formData.set('message', message);
  return formData;
}

let sentBody: unknown;

function apiAccepts() {
  sentBody = undefined;
  server.use(
    http.post(ENDPOINT, async ({ request }) => {
      sentBody = await request.json();
      return HttpResponse.json({ feedbackId: FEEDBACK_ID }, { status: 201 });
    }),
  );
}

function apiRefuses(code: string, status: number) {
  server.use(
    http.post(ENDPOINT, () =>
      HttpResponse.json(
        { error: { code, message: code, correlationId: 'test' } },
        { status },
      ),
    ),
  );
}

describe('answering an Ask', () => {
  it('sends what was written and goes back to the Ask, which then shows it', async () => {
    apiAccepts();

    await expect(
      answerAsk(WORKSPACE_ID, {}, answering(WRITTEN)),
    ).rejects.toThrow(new Redirected(`/home?tab=waiting&ask=${ASK_ID}`));
    expect(sentBody).toEqual({ message: WRITTEN });
  });

  it('refuses an empty answer without asking the API', async () => {
    apiAccepts();

    const state = await answerAsk(WORKSPACE_ID, {}, answering('   '));

    expect(state.fieldErrors?.message).toBe(
      'Write your answer before sending it.',
    );
    expect(sentBody).toBeUndefined();
  });

  it('names the limit when the answer is too long, without asking the API', async () => {
    apiAccepts();

    const state = await answerAsk(
      WORKSPACE_ID,
      {},
      answering('a'.repeat(4001)),
    );

    expect(state.fieldErrors?.message).toContain('4,000');
    expect(sentBody).toBeUndefined();
  });

  it('sends the person back to the Ask when they had already answered it', async () => {
    apiRefuses('ASK_ALREADY_ANSWERED', 409);

    await expect(
      answerAsk(WORKSPACE_ID, {}, answering(WRITTEN)),
    ).rejects.toThrow(new Redirected(`/home?tab=waiting&ask=${ASK_ID}`));
  });

  it('sends the person back to the Ask’s dialog, which says it is not there, when it is not theirs', async () => {
    apiRefuses('FEEDBACK_ASK_NOT_FOUND', 404);

    await expect(
      answerAsk(WORKSPACE_ID, {}, answering(WRITTEN)),
    ).rejects.toThrow(new Redirected(`/home?tab=waiting&ask=${ASK_ID}`));
  });

  it('sends a signed-out person to sign in', async () => {
    apiRefuses('NOT_SIGNED_IN', 401);

    await expect(
      answerAsk(WORKSPACE_ID, {}, answering(WRITTEN)),
    ).rejects.toThrow(new Redirected('/signin'));
  });

  it('keeps what was written when the API fails for a reason of its own', async () => {
    apiRefuses('SOMETHING_ELSE', 500);

    const state = await answerAsk(WORKSPACE_ID, {}, answering(WRITTEN));

    expect(state.formError).toBe(
      "We couldn't send your answer. Please try again.",
    );
  });
});
