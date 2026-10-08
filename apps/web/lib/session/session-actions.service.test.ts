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
const cookieStore = { set: vi.fn() };

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

describe('session actions', () => {
  beforeEach(() => {
    requestHeaders.delete('cookie');
  });

  it('signing in hands the browser the state cookie, then sends it to Google', async () => {
    server.use(
      http.post(`${TEST_API_BASE_URL}/v1/sessions/google`, () =>
        HttpResponse.json(
          { url: 'https://accounts.google.com/o/oauth2/v2/auth?state=s1' },
          {
            headers: {
              'Set-Cookie':
                'thrive.state=s1.sig%2B; Max-Age=300; Path=/; HttpOnly; SameSite=Lax',
            },
          },
        ),
      ),
    );

    await expect(signIn()).rejects.toThrow(
      'redirect:https://accounts.google.com/o/oauth2/v2/auth?state=s1',
    );
    expect(cookieStore.set).toHaveBeenCalledWith('thrive.state', 's1.sig+', {
      maxAge: 300,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
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
