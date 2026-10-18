/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs: in jsdom, MSW would keep a browser cookie jar
 * and send one test's cookies with the next test's requests.
 */
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

const requestHeaders = new Headers();
const cookieStore = { set: vi.fn(), delete: vi.fn() };

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => requestHeaders,
  cookies: async () => cookieStore,
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

const { acceptInvitation, signInToAccept, useAnotherGoogleAccount } =
  await import('./invitation-actions.service');

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000001';
const ACCEPT = `${TEST_API_BASE_URL}/v1/invitations/${INVITATION_ID}/accept`;
const GOOGLE_URL = 'https://accounts.google.com/o/oauth2/v2/auth?state=s1';

function apiRefusesWith(code: string, status: number) {
  server.use(
    http.post(ACCEPT, () =>
      HttpResponse.json(
        { error: { code, message: 'Refused.', correlationId: 'c-1' } },
        { status },
      ),
    ),
  );
}

function googleSignInStarts(bodies: unknown[] = []) {
  server.use(
    http.post(
      `${TEST_API_BASE_URL}/v1/sessions/google`,
      async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ url: GOOGLE_URL });
      },
    ),
  );
}

beforeEach(() => {
  requestHeaders.set('cookie', 'thrive.session_token=abc');
  requestHeaders.set('origin', 'https://thrive.test');
  cookieStore.set.mockReset();
  cookieStore.delete.mockReset();
});

function rememberedIntents(): unknown[] {
  return cookieStore.set.mock.calls
    .filter(([name]) => name === 'thrive.join_intent')
    .map(([, value]) => value);
}

describe('accepting an Invitation', () => {
  it('accepts as the signed-in person, then sends them where they belong', async () => {
    const seen: Request[] = [];
    server.use(
      http.post(ACCEPT, ({ request }) => {
        seen.push(request);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(acceptInvitation(INVITATION_ID)).rejects.toThrow(
      'redirect:/home',
    );
    expect(seen[0]?.headers.get('cookie')).toContain(
      'thrive.session_token=abc',
    );
    expect(cookieStore.delete).toHaveBeenCalledWith('thrive.join_intent');
  });

  it('stays to explain when the Invitation was sent to another address', async () => {
    apiRefusesWith('INVITATION_NOT_FOR_YOU', 403);

    expect(await acceptInvitation(INVITATION_ID)).toEqual({
      refusal: 'notForYou',
    });
    // Spent even on a refusal, so the page never joins again by itself.
    expect(cookieStore.delete).toHaveBeenCalledWith('thrive.join_intent');
  });

  it('opens the Invitation again when it has expired meanwhile, so the page says so', async () => {
    apiRefusesWith('INVITATION_EXPIRED', 409);

    await expect(acceptInvitation(INVITATION_ID)).rejects.toThrow(
      `redirect:/invitations/${INVITATION_ID}`,
    );
  });

  it('answers a failure it cannot explain as one to try again', async () => {
    apiRefusesWith('SOMETHING_ELSE', 500);

    expect(await acceptInvitation(INVITATION_ID)).toEqual({
      refusal: 'failed',
    });
  });

  it('never calls the API with something that is not an Invitation id', async () => {
    expect(await acceptInvitation('../sessions')).toEqual({
      refusal: 'failed',
    });
  });
});

describe('signing in to accept', () => {
  it('starts Google sign-in that comes back to this Invitation', async () => {
    const bodies: unknown[] = [];
    googleSignInStarts(bodies);

    await expect(signInToAccept(INVITATION_ID)).rejects.toThrow(
      `redirect:${GOOGLE_URL}`,
    );
    expect(bodies).toEqual([{ invitationId: INVITATION_ID }]);
  });

  it('remembers that the person chose to join this Invitation', async () => {
    googleSignInStarts();

    await expect(signInToAccept(INVITATION_ID)).rejects.toThrow(
      `redirect:${GOOGLE_URL}`,
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'thrive.join_intent',
      INVITATION_ID,
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 600,
      },
    );
  });

  it('remembers the intent unsecured on a local http server, where a secure one would be lost', async () => {
    requestHeaders.set('origin', 'http://localhost:3001');
    googleSignInStarts();

    await expect(signInToAccept(INVITATION_ID)).rejects.toThrow(
      `redirect:${GOOGLE_URL}`,
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'thrive.join_intent',
      INVITATION_ID,
      expect.objectContaining({ secure: false }),
    );
  });

  it('remembers nothing for something that is not an Invitation id', async () => {
    await expect(signInToAccept('../sessions')).rejects.toThrow(
      'redirect:/signin',
    );
    expect(rememberedIntents()).toEqual([]);
  });

  it('signs out first when switching to another Google account', async () => {
    const calls: string[] = [];
    server.use(
      http.delete(`${TEST_API_BASE_URL}/v1/sessions/current`, () => {
        calls.push('signOut');
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(
        `${TEST_API_BASE_URL}/v1/sessions/google`,
        async ({ request }) => {
          calls.push(`signIn:${JSON.stringify(await request.json())}`);
          return HttpResponse.json({ url: GOOGLE_URL });
        },
      ),
    );

    await expect(useAnotherGoogleAccount(INVITATION_ID)).rejects.toThrow(
      `redirect:${GOOGLE_URL}`,
    );
    expect(calls).toEqual([
      'signOut',
      `signIn:${JSON.stringify({ invitationId: INVITATION_ID })}`,
    ]);
    expect(rememberedIntents()).toEqual([INVITATION_ID]);
  });
});
