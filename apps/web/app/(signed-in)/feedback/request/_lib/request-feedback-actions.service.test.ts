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

const requireMember = vi.fn(async () => ({
  email: 'ann@acme.test',
  membership: { workspace: { id: WORKSPACE_ID, name: 'Acme' }, role: 'OWNER' },
}));
vi.mock('@/lib/session/session.service', () => ({
  requireMember: () => requireMember(),
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

function apiAccepts() {
  server.use(
    http.post(ENDPOINT, () =>
      HttpResponse.json({ id: REQUEST_ID }, { status: 201 }),
    ),
  );
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
  fields: Partial<{ giverAccountId: string; topic: string }> = {},
): FormData {
  const formData = new FormData();
  formData.set('giverAccountId', fields.giverAccountId ?? BEN);
  formData.set('topic', fields.topic ?? 'my sprint review talk');
  return formData;
}

/** The action either answers a state or redirects by throwing; this tells the two apart. */
async function send(formData: FormData) {
  try {
    return { state: await requestFeedback({}, formData), to: undefined };
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

  it('sends it in the Workspace the session belongs to, then shows what was sent', async () => {
    apiAccepts();

    const { to } = await send(form());

    expect(to).toBe(`/feedback/requests/${REQUEST_ID}`);
    expect(requireMember).toHaveBeenCalledOnce();
  });

  it('refuses a blank Topic without calling the API', async () => {
    const { state } = await send(form({ topic: '   ' }));

    expect(state).toEqual({
      fieldErrors: { giverAccountId: undefined, topic: 'Add a Topic.' },
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
