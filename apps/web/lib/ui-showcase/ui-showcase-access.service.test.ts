/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { beforeEach, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { notFound, redirect } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error('not-found');
  }),
  redirect: vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  }),
}));
vi.mock('next/navigation', () => ({ notFound, redirect }));

const { requireUiShowcaseAccess } = await import(
  './ui-showcase-access.service'
);

const CURRENT_SESSION = `${TEST_API_BASE_URL}/v1/sessions/current`;
const ACCESS = `${TEST_API_BASE_URL}/v1/ui-showcase-access/mine`;
const NOT_SIGNED_IN = {
  error: {
    code: 'NOT_SIGNED_IN',
    message: 'Sign in to do this.',
    correlationId: 'c-1',
  },
};

function answerSignedIn() {
  server.use(
    http.get(CURRENT_SESSION, () =>
      HttpResponse.json({
        account: {
          email: 'ann@acme.test',
          name: 'Ann Lee',
          photoUrl: null,
          profile: { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' },
        },
        needsRefresh: false,
      }),
    ),
  );
}

beforeEach(() => {
  notFound.mockClear();
  redirect.mockClear();
});

it('lets in someone the API says is on the list, asking as them', async () => {
  answerSignedIn();
  let cookie: string | null = null;
  server.use(
    http.get(ACCESS, ({ request }) => {
      cookie = request.headers.get('cookie');
      return HttpResponse.json({ isAllowed: true });
    }),
  );

  await expect(requireUiShowcaseAccess()).resolves.toBeUndefined();
  expect(cookie).toBe('thrive.session_token=abc');
  expect(notFound).not.toHaveBeenCalled();
});

it('answers not found to someone signed in but not on the list', async () => {
  answerSignedIn();
  server.use(http.get(ACCESS, () => HttpResponse.json({ isAllowed: false })));

  await expect(requireUiShowcaseAccess()).rejects.toThrow('not-found');
});

it('sends someone whose session has lapsed to sign in, not to not found', async () => {
  server.use(
    http.get(CURRENT_SESSION, () =>
      HttpResponse.json({ account: null, needsRefresh: false }),
    ),
    http.get(ACCESS, () => HttpResponse.json(NOT_SIGNED_IN, { status: 401 })),
  );

  await expect(requireUiShowcaseAccess()).rejects.toThrow('redirect:/signin');
  expect(notFound).not.toHaveBeenCalled();
});

it('answers not found when the API refuses the session it was shown', async () => {
  answerSignedIn();
  server.use(
    http.get(ACCESS, () => HttpResponse.json(NOT_SIGNED_IN, { status: 401 })),
  );

  await expect(requireUiShowcaseAccess()).rejects.toThrow('not-found');
});

it('answers not found when the API cannot be reached, rather than letting anybody in', async () => {
  answerSignedIn();
  server.use(http.get(ACCESS, () => HttpResponse.error()));

  await expect(requireUiShowcaseAccess()).rejects.toThrow('not-found');
});
