import { beforeEach, describe, expect, it, vi } from 'vitest';

const POST = vi.fn();
const DELETE = vi.fn();
const requestHeaders = new Headers();
const cookieStore = { set: vi.fn() };

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
vi.mock('@/lib/api-client.service', () => ({
  apiClient: () => ({ POST, DELETE }),
}));

const { signIn, signOut } = await import('./session-actions.service');

function apiResponse(setCookies: string[]): Response {
  const headers = new Headers();
  for (const cookie of setCookies) headers.append('set-cookie', cookie);
  return new Response(null, { headers });
}

describe('session actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestHeaders.delete('cookie');
  });

  it('signing in hands the browser the state cookie, then sends it to Google', async () => {
    POST.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?state=s1' },
      response: apiResponse([
        'thrive.state=s1.sig%2B; Max-Age=300; Path=/; HttpOnly; SameSite=Lax',
      ]),
    });

    await expect(signIn()).rejects.toThrow(
      'redirect:https://accounts.google.com/o/oauth2/v2/auth?state=s1',
    );
    expect(POST).toHaveBeenCalledWith('/v1/sessions/google');
    expect(cookieStore.set).toHaveBeenCalledWith('thrive.state', 's1.sig+', {
      maxAge: 300,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  });

  it('signing out ends the session, clears the cookie and returns to sign-in', async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    DELETE.mockResolvedValue({
      response: apiResponse([
        'thrive.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax',
      ]),
    });

    await expect(signOut()).rejects.toThrow('redirect:/login');
    expect(DELETE).toHaveBeenCalledWith('/v1/sessions/current', {
      params: { header: { cookie: 'thrive.session_token=abc' } },
    });
    expect(cookieStore.set).toHaveBeenCalledWith('thrive.session_token', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  });
});
