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

const { refreshSession, signIn, signOut } = await import(
  './session-actions.service'
);

function answerGoogle() {
  server.use(
    http.post(`${TEST_API_BASE_URL}/v1/sessions/google`, () =>
      HttpResponse.json({
        url: 'https://accounts.google.com/o/oauth2/v2/auth?state=s1',
      }),
    ),
  );
}

describe('session actions', () => {
  beforeEach(() => {
    requestHeaders.delete('cookie');
    cookieStore.set.mockClear();
    cookieStore.delete.mockClear();
  });

  it('signing in hands the browser the state cookie, then sends it to Google', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/v1/sessions/google`,
        async ({ request }) => {
          bodies.push(await request.json());
          return HttpResponse.json(
            { url: 'https://accounts.google.com/o/oauth2/v2/auth?state=s1' },
            {
              headers: {
                'Set-Cookie':
                  'thrive.state=s1.sig%2B; Max-Age=300; Path=/; HttpOnly; SameSite=Lax',
              },
            },
          );
        },
      ),
    );

    await expect(signIn(null)).rejects.toThrow(
      'redirect:https://accounts.google.com/o/oauth2/v2/auth?state=s1',
    );
    expect(cookieStore.set).toHaveBeenCalledWith('thrive.state', 's1.sig+', {
      maxAge: 300,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
    // No Invitation: Google sends the person back to where they usually land.
    expect(bodies).toEqual([{}]);
  });

  it('signing in from a link holds on to the page it pointed at', async () => {
    answerGoogle();

    await expect(
      signIn('/home?tab=waiting&ask=0199a0f0-0000-7000-8000-000000000001'),
    ).rejects.toThrow('redirect:https://accounts.google.com');

    expect(cookieStore.set).toHaveBeenCalledWith(
      'thrive.sign_in_destination',
      '/home?tab=waiting&ask=0199a0f0-0000-7000-8000-000000000001',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
  });

  it.each([
    'https://evil.test/phish',
    '//evil.test',
    '/\\evil.test',
    '/..//evil.test',
    '/home?signedIn=1',
  ])(
    'signing in with %j for a destination holds on to nothing',
    async (destination) => {
      answerGoogle();

      await expect(signIn(destination)).rejects.toThrow(
        'redirect:https://accounts.google.com',
      );

      expect(cookieStore.set).not.toHaveBeenCalledWith(
        'thrive.sign_in_destination',
        expect.anything(),
        expect.anything(),
      );
      expect(cookieStore.delete).toHaveBeenCalledWith(
        'thrive.sign_in_destination',
      );
    },
  );

  it('signing in from the landing page drops what an abandoned attempt left behind', async () => {
    answerGoogle();

    await expect(signIn(null)).rejects.toThrow(
      'redirect:https://accounts.google.com',
    );

    expect(cookieStore.delete).toHaveBeenCalledWith(
      'thrive.sign_in_destination',
    );
  });

  it('signing out ends the session, clears the cookie and returns to sign-in', async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    const seen: Request[] = [];
    server.use(
      http.delete(`${TEST_API_BASE_URL}/v1/sessions/current`, ({ request }) => {
        seen.push(request);
        return new HttpResponse(null, {
          status: 204,
          headers: {
            'Set-Cookie':
              'thrive.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax',
          },
        });
      }),
    );

    await expect(signOut()).rejects.toThrow('redirect:/signin');
    // `toContain`, not `toBe`: MSW keeps a cookie jar like a browser does, so a cookie an
    // earlier test's mocked response set can ride along. Real server-side fetch keeps none.
    expect(seen[0]?.headers.get('cookie')).toContain(
      'thrive.session_token=abc',
    );
    expect(cookieStore.set).toHaveBeenCalledWith('thrive.session_token', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  });

  it('refreshing posts with the cookie and hands the browser the renewed one', async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    const seen: Request[] = [];
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/v1/sessions/current/refresh`,
        ({ request }) => {
          seen.push(request);
          return new HttpResponse(null, {
            status: 204,
            headers: {
              'Set-Cookie':
                'thrive.session_token=abc.sig%2B; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax',
            },
          });
        },
      ),
    );

    await refreshSession();

    // `toContain`: as above, MSW's cookie jar can add an earlier test's cookie.
    expect(seen[0]?.headers.get('cookie')).toContain(
      'thrive.session_token=abc',
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'thrive.session_token',
      'abc.sig+',
      { maxAge: 604800, path: '/', httpOnly: true, sameSite: 'lax' },
    );
  });
});
