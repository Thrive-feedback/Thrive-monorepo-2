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
const KUDOS_ID = '0199a0f0-0000-7000-8000-0000000000k1';

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

const { giveKudos } = await import('./give-kudos-actions.service');

const ENDPOINT = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/kudos`;

/** Accepts the send, keeping the body the API was given. */
function apiAccepts(): { body?: unknown } {
  const received: { body?: unknown } = {};
  server.use(
    http.post(ENDPOINT, async ({ request }) => {
      received.body = await request.json();
      return HttpResponse.json({ id: KUDOS_ID }, { status: 201 });
    }),
  );
  return received;
}

function apiRefuses(code: string, status: number) {
  server.use(
    http.post(ENDPOINT, () =>
      HttpResponse.json(
        { error: { code, message: 'nope', correlationId: 'correlation-1' } },
        { status },
      ),
    ),
  );
}

function form(message: string): FormData {
  const formData = new FormData();
  formData.set('message', message);
  return formData;
}

async function redirectOf(promise: Promise<unknown>) {
  const error = await promise.catch((caught: unknown) => caught);
  return error instanceof Redirected ? error.to : undefined;
}

describe('giveKudos', () => {
  beforeEach(() => {
    requireMember.mockClear();
  });

  it('sends the message as written and goes back to Home saying it went', async () => {
    const received = apiAccepts();

    const to = await redirectOf(
      giveKudos(WORKSPACE_ID, {}, form('@ben carried the launch.')),
    );

    expect(to).toBe('/home?kudos=1');
    expect(received.body).toEqual({ message: '@ben carried the launch.' });
    expect(requireMember).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it('asks for a message before asking the API anything', async () => {
    const state = await giveKudos(WORKSPACE_ID, {}, form('   '));

    expect(state).toEqual({ fieldErrors: { message: 'Write your Kudos.' } });
    expect(requireMember).not.toHaveBeenCalled();
  });

  it('refuses more than 280 characters, counting an emoji as one', async () => {
    const fits = apiAccepts();
    await redirectOf(giveKudos(WORKSPACE_ID, {}, form('👏'.repeat(280))));
    expect(fits.body).toBeDefined();

    const state = await giveKudos(WORKSPACE_ID, {}, form('a'.repeat(281)));
    expect(state.fieldErrors?.message).toMatch(/Keep it to 280 characters/);
  });

  it('goes to sign in when the session has ended', async () => {
    apiRefuses('NOT_SIGNED_IN', 401);

    const to = await redirectOf(
      giveKudos(WORKSPACE_ID, {}, form('@ben carried the launch.')),
    );

    expect(to).toBe('/signin');
  });

  it('says it could not send on anything else', async () => {
    apiRefuses('SOMETHING_ELSE', 500);

    const state = await giveKudos(
      WORKSPACE_ID,
      {},
      form('@ben carried the launch.'),
    );

    expect(state.formError).toBe(
      "We couldn't send your Kudos. Please try again.",
    );
  });
});
