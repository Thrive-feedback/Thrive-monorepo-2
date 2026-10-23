/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestHeaders = new Headers();
const jar = new Map<string, string>();
const cookieStore = {
  get: (name: string) =>
    jar.has(name) ? { name, value: jar.get(name) } : undefined,
  set: vi.fn((name: string, value: string) => {
    jar.set(name, value);
  }),
  delete: vi.fn((name: string) => {
    jar.delete(name);
  }),
};

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => requestHeaders,
  cookies: async () => cookieStore,
}));

const { forgetSignInDestination, rememberSignInDestination } = await import(
  './sign-in-destination.service'
);
const { SIGN_IN_DESTINATION_COOKIE } = await import(
  './sign-in-destination.constant'
);

const WAITING_ASK =
  '/home?tab=waiting&ask=0199a0f0-0000-7000-8000-000000000001';

beforeEach(() => {
  jar.clear();
  cookieStore.set.mockClear();
  cookieStore.delete.mockClear();
  requestHeaders.set('origin', 'https://thrive.test');
});

describe('where signing in should land', () => {
  it('is held where no script or other site can reach it, only as long as a sign-in takes', async () => {
    await rememberSignInDestination(WAITING_ASK);

    expect(jar.get(SIGN_IN_DESTINATION_COOKIE)).toBe(WAITING_ASK);
    expect(cookieStore.set).toHaveBeenCalledWith(
      SIGN_IN_DESTINATION_COOKIE,
      WAITING_ASK,
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 600,
      },
    );
  });

  it('is not marked secure where the site is served over plain http, or it would never come back', async () => {
    requestHeaders.set('origin', 'http://localhost:3001');

    await rememberSignInDestination(WAITING_ASK);

    expect(cookieStore.set).toHaveBeenCalledWith(
      SIGN_IN_DESTINATION_COOKIE,
      WAITING_ASK,
      expect.objectContaining({ secure: false }),
    );
  });

  it('is marked secure when there is no origin to judge by', async () => {
    requestHeaders.delete('origin');

    await rememberSignInDestination(WAITING_ASK);

    expect(cookieStore.set).toHaveBeenCalledWith(
      SIGN_IN_DESTINATION_COOKIE,
      WAITING_ASK,
      expect.objectContaining({ secure: true }),
    );
  });

  it('is gone once forgotten', async () => {
    await rememberSignInDestination(WAITING_ASK);

    await forgetSignInDestination();

    expect(jar.has(SIGN_IN_DESTINATION_COOKIE)).toBe(false);
  });
});
