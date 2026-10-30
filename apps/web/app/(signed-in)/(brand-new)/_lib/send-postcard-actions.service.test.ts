/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';
import type { SentPostcard } from './sent-postcard.type';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const SENT_ID = '0199a0f0-0000-7000-8000-0000000000e1';
const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';

const requireMember = vi.fn(async (_workspaceId: string) => ({
  email: 'ann@acme.test',
  membership: { workspace: { id: WORKSPACE_ID, name: 'Acme' }, role: 'ADMIN' },
}));
vi.mock('@/lib/session/session.service', () => ({
  requireMemberOf: (workspaceId: string) => requireMember(workspaceId),
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

const { sendPostcardFeedback, sendPostcardRequest } = await import(
  './send-postcard-actions.service'
);

const FEEDBACK = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback`;
const REQUESTS = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback-requests`;

const LOOK: SentPostcard['look'] = {
  templateKey: 'system/postcard_template_2',
  tone: 'sage',
  textStyle: { font: 'classic', sizeStep: 3, align: 'center', ink: 'navy' },
  stamps: [
    {
      stampKey: 'system/stamp-02-ocean',
      side: 'front',
      x: 62.5,
      y: 40,
      scale: 1.25,
      rotation: -8,
    },
  ],
};

function aCard(overrides: Partial<SentPostcard> = {}): SentPostcard {
  return {
    recipientAccountIds: [BEN],
    message: 'You kept the room with you.',
    visibility: 'ONLY_ME',
    selectedAccountIds: [],
    look: LOOK,
    ...overrides,
  };
}

/** Accepts the send, keeping the body the API was given. */
function apiAccepts(endpoint: string): { body?: unknown } {
  const received: { body?: unknown } = {};
  server.use(
    http.post(endpoint, async ({ request }) => {
      received.body = await request.json();
      return HttpResponse.json({ id: SENT_ID }, { status: 201 });
    }),
  );
  return received;
}

function apiRefuses(endpoint: string, code: string, status: number) {
  server.use(
    http.post(endpoint, () =>
      HttpResponse.json(
        { error: { code, message: 'nope', correlationId: 'correlation-1' } },
        { status },
      ),
    ),
  );
}

beforeEach(() => {
  requireMember.mockClear();
});

describe('sending a postcard of Feedback', () => {
  it('gives it with everything on the card, and answers with nothing to say', async () => {
    const received = apiAccepts(FEEDBACK);

    const result = await sendPostcardFeedback(WORKSPACE_ID, aCard());

    expect(result).toEqual({});
    expect(received.body).toEqual({
      receiverAccountIds: [BEN],
      message: 'You kept the room with you.',
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
      postcard: LOOK,
    });
  });

  it('names who else reads it only under Selected people', async () => {
    const received = apiAccepts(FEEDBACK);

    await sendPostcardFeedback(
      WORKSPACE_ID,
      aCard({ visibility: 'SELECTED_PEOPLE', selectedAccountIds: [CARA] }),
    );

    expect(received.body).toMatchObject({
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [CARA],
    });
  });

  it('says what went wrong when the API refuses it, with the card kept', async () => {
    apiRefuses(FEEDBACK, 'RECEIVER_NOT_IN_WORKSPACE', 400);

    const result = await sendPostcardFeedback(WORKSPACE_ID, aCard());

    expect(result.formError).toBe(
      'Someone you picked it for is no longer in your Workspace.',
    );
  });

  it('falls back to asking again on a refusal it has no words for', async () => {
    apiRefuses(FEEDBACK, 'POSTCARD_INVALID', 400);

    const result = await sendPostcardFeedback(WORKSPACE_ID, aCard());

    expect(result.formError).toBe(
      "We couldn't send your feedback. Please try again.",
    );
  });

  it('checks the session again before anything is sent', async () => {
    apiAccepts(FEEDBACK);

    await sendPostcardFeedback(WORKSPACE_ID, aCard());

    expect(requireMember).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it('sends nothing for a message over the limit', async () => {
    const received = apiAccepts(FEEDBACK);

    const result = await sendPostcardFeedback(
      WORKSPACE_ID,
      aCard({ message: 'a'.repeat(1001) }),
    );

    expect(result.formError).toBeDefined();
    expect(received.body).toBeUndefined();
  });

  it('takes the person to sign in once their session has gone', async () => {
    apiRefuses(FEEDBACK, 'NOT_SIGNED_IN', 401);

    await expect(
      sendPostcardFeedback(WORKSPACE_ID, aCard()),
    ).rejects.toMatchObject({ to: '/signin' });
  });

  it('takes the person back to the new Home once they have left the Workspace', async () => {
    apiRefuses(FEEDBACK, 'WORKSPACE_NOT_FOUND', 404);

    await expect(
      sendPostcardFeedback(WORKSPACE_ID, aCard()),
    ).rejects.toMatchObject({ to: '/brand-new-home' });
  });
});

describe('sending a postcard asking for Feedback', () => {
  it('asks with everything on the card, naming nobody extra', async () => {
    const received = apiAccepts(REQUESTS);

    const result = await sendPostcardRequest(WORKSPACE_ID, aCard());

    expect(result).toEqual({});
    expect(received.body).toEqual({
      giverAccountIds: [BEN],
      message: 'You kept the room with you.',
      visibility: 'ONLY_ME',
      postcard: LOOK,
    });
  });

  it('says what went wrong when the API refuses it', async () => {
    apiRefuses(REQUESTS, 'CANNOT_ASK_YOURSELF', 400);

    const result = await sendPostcardRequest(WORKSPACE_ID, aCard());

    expect(result.formError).toBe("You can't ask yourself for Feedback.");
  });
});
