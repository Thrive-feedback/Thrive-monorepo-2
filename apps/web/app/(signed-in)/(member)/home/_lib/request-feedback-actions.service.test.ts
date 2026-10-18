/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
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

const { requestFeedback } = await import('./request-feedback-actions.service');

const ENDPOINT = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feedback-requests`;

/** Accepts the send, keeping the body the API was given. */
function apiAccepts(): { body?: unknown } {
  const received: { body?: unknown } = {};
  server.use(
    http.post(ENDPOINT, async ({ request }) => {
      received.body = await request.json();
      return HttpResponse.json({ id: REQUEST_ID }, { status: 201 });
    }),
  );
  return received;
}

function apiRefuses(code: string, status: number) {
  server.use(
    http.post(ENDPOINT, () =>
      HttpResponse.json(
        {
          error: { code, message: 'nope', correlationId: 'correlation-1' },
        },
        { status },
      ),
    ),
  );
}

function form(
  fields: Partial<{
    giverAccountId: string;
    topic: string;
    visibility: string;
    selectedAccountIds: string[];
  }> = {},
): FormData {
  const formData = new FormData();
  formData.set('giverAccountId', fields.giverAccountId ?? BEN);
  formData.set('topic', fields.topic ?? 'my sprint review talk');
  formData.set('visibility', fields.visibility ?? 'ONLY_ME');
  for (const accountId of fields.selectedAccountIds ?? []) {
    formData.append('selectedAccountIds', accountId);
  }
  return formData;
}

/** The action either answers a state or redirects by throwing; this tells the two apart. */
async function send(formData: FormData) {
  try {
    return {
      state: await requestFeedback(WORKSPACE_ID, {}, formData),
      to: undefined,
    };
  } catch (error) {
    if (error instanceof Redirected) {
      return { state: undefined, to: error.to };
    }
    throw error;
  }
}

describe('asking a teammate for Feedback', () => {
  beforeEach(() => {
    requireMember.mockClear();
  });

  it('sends it in the Workspace the session belongs to, then lists it under My requests', async () => {
    apiAccepts();

    const { to } = await send(form());

    expect(to).toBe('/home?tab=my-requests&sent=1');
    expect(requireMember).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it('refuses a blank Topic without calling the API', async () => {
    const { state } = await send(form({ topic: '   ' }));

    expect(state).toEqual({
      fieldErrors: {
        giverAccountId: undefined,
        topic: 'Add a Topic.',
        selectedAccountIds: undefined,
      },
    });
  });

  it('sends who besides the Requester may read the answers', async () => {
    const received = apiAccepts();

    await send(
      form({ visibility: 'SELECTED_PEOPLE', selectedAccountIds: [CARA] }),
    );

    expect(received.body).toEqual({
      topic: 'my sprint review talk',
      giverAccountIds: [BEN],
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [CARA],
    });
  });

  it('sends no people with any other choice', async () => {
    const received = apiAccepts();

    await send(form({ visibility: 'EVERYONE' }));

    expect(received.body).toEqual({
      topic: 'my sprint review talk',
      giverAccountIds: [BEN],
      visibility: 'EVERYONE',
    });
  });

  it('refuses Selected people with nobody picked, without calling the API', async () => {
    const { state } = await send(form({ visibility: 'SELECTED_PEOPLE' }));

    expect(state?.fieldErrors?.selectedAccountIds).toBe(
      'Pick at least one person to share it with.',
    );
  });

  it('says it plainly when somebody picked has left the Workspace', async () => {
    apiRefuses('SELECTED_PERSON_NOT_IN_WORKSPACE', 400);

    const { state } = await send(
      form({ visibility: 'SELECTED_PEOPLE', selectedAccountIds: [CARA] }),
    );

    expect(state).toEqual({
      formError:
        'Someone you picked to share it with is no longer in your Workspace.',
    });
  });

  it('refuses a teammate that is not an Account id', async () => {
    const { state } = await send(form({ giverAccountId: 'not-an-id' }));

    expect(state?.fieldErrors?.giverAccountId).toBe('Pick who to ask.');
  });

  it('says it plainly when the teammate has left the Workspace', async () => {
    apiRefuses('GIVER_NOT_IN_WORKSPACE', 400);

    const { state } = await send(form());

    expect(state).toEqual({
      formError: 'That teammate is no longer in your Workspace.',
    });
  });

  it('sends a person whose session has gone back to sign in', async () => {
    apiRefuses('NOT_SIGNED_IN', 401);

    const { to } = await send(form());

    expect(to).toBe('/signin');
  });

  it('sends a person who has left the Workspace home', async () => {
    apiRefuses('WORKSPACE_NOT_FOUND', 404);

    const { to } = await send(form());

    expect(to).toBe('/home');
  });

  it('falls back to one message for a code it does not know', async () => {
    apiRefuses('SOMETHING_NEW', 500);

    const { state } = await send(form());

    expect(state).toEqual({
      formError: "We couldn't send your request. Please try again.",
    });
  });
});
