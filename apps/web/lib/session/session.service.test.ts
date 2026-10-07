/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs: in jsdom, MSW would keep a browser cookie jar
 * and send one test's cookies with the next test's requests.
 */
import { ApiError } from '@repo/api';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

const requestHeaders = new Headers();

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('react', async (actual) => ({
  ...(await actual<typeof import('react')>()),
  // Outside a server render `cache` would hold one answer for the whole test file.
  cache: <T>(fn: T) => fn,
}));
vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

const {
  readSession,
  readSessionNeedsRefresh,
  requireAccountToIntroduce,
  requireIntroducedAccount,
} = await import('./session.service');

const CURRENT_SESSION = `${TEST_API_BASE_URL}/v1/sessions/current`;
const ANN_PROFILE = { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' };

function answerSignedInAs(profile: typeof ANN_PROFILE | null) {
  server.use(
    http.get(CURRENT_SESSION, () =>
      HttpResponse.json({
        account: { email: 'ann@acme.test', name: 'Ann Lee', profile },
        needsRefresh: false,
      }),
    ),
  );
}

function answerSignedOut() {
  server.use(
    http.get(CURRENT_SESSION, () =>
      HttpResponse.json({ account: null, needsRefresh: false }),
    ),
  );
}

describe('readSession', () => {
  beforeEach(() => {
    requestHeaders.delete('cookie');
  });

  it("asks the API with the browser's cookie and a correlation id", async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    const seen: Request[] = [];
    server.use(
      http.get(CURRENT_SESSION, ({ request }) => {
        seen.push(request);
        return HttpResponse.json({
          account: { email: 'ann@acme.test', name: 'Ann Lee', profile: null },
          needsRefresh: false,
        });
      }),
    );

    expect(await readSession()).toEqual({
      email: 'ann@acme.test',
      name: 'Ann Lee',
      profile: null,
    });
    expect(seen[0]?.headers.get('cookie')).toBe('thrive.session_token=abc');
    expect(seen[0]?.headers.get('x-correlation-id')).toBeTruthy();
  });

  it('is null when the API says nobody is signed in', async () => {
    const seen: Request[] = [];
    server.use(
      http.get(CURRENT_SESSION, ({ request }) => {
        seen.push(request);
        return HttpResponse.json({ account: null, needsRefresh: false });
      }),
    );

    expect(await readSession()).toBeNull();
    expect(seen[0]?.headers.has('cookie')).toBe(false);
  });

  it("fails with the API's error code when the API fails", async () => {
    server.use(
      http.get(CURRENT_SESSION, () =>
        HttpResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Something went wrong.',
              correlationId: 'c-1',
            },
          },
          { status: 500 },
        ),
      ),
    );

    await expect(readSession()).rejects.toMatchObject({
      constructor: ApiError,
      code: 'INTERNAL_ERROR',
      correlationId: 'c-1',
    });
  });

  it('says when the session is due a refresh', async () => {
    server.use(
      http.get(CURRENT_SESSION, () =>
        HttpResponse.json({
          account: { email: 'ann@acme.test', name: 'Ann Lee', profile: null },
          needsRefresh: true,
        }),
      ),
    );

    expect(await readSessionNeedsRefresh()).toBe(true);
  });
});

describe('requireIntroducedAccount', () => {
  it('answers the Account of someone who has introduced themselves', async () => {
    answerSignedInAs(ANN_PROFILE);

    expect(await requireIntroducedAccount()).toEqual({
      email: 'ann@acme.test',
      name: 'Ann Lee',
      profile: ANN_PROFILE,
    });
  });

  it('sends a signed-out visitor to sign-in', async () => {
    answerSignedOut();

    await expect(requireIntroducedAccount()).rejects.toThrow('redirect:/login');
  });

  it('sends someone who has not introduced themselves to Introduce yourself', async () => {
    answerSignedInAs(null);

    await expect(requireIntroducedAccount()).rejects.toThrow(
      'redirect:/register/introduce-yourself',
    );
  });

  it('keeps "just signed in" across that redirect, so the toast still shows', async () => {
    answerSignedInAs(null);

    await expect(requireIntroducedAccount('1')).rejects.toThrow(
      'redirect:/register/introduce-yourself?signedIn=1',
    );
  });
});

describe('requireAccountToIntroduce', () => {
  it('answers the Account of someone who has not introduced themselves', async () => {
    answerSignedInAs(null);

    expect(await requireAccountToIntroduce()).toEqual({
      email: 'ann@acme.test',
      name: 'Ann Lee',
      profile: null,
    });
  });

  it('sends a signed-out visitor to sign-in', async () => {
    answerSignedOut();

    await expect(requireAccountToIntroduce()).rejects.toThrow(
      'redirect:/login',
    );
  });

  it('sends someone who has already introduced themselves home', async () => {
    answerSignedInAs(ANN_PROFILE);

    await expect(requireAccountToIntroduce()).rejects.toThrow('redirect:/home');
  });

  it('keeps "just signed in" across that redirect', async () => {
    answerSignedInAs(ANN_PROFILE);

    await expect(requireAccountToIntroduce('1')).rejects.toThrow(
      'redirect:/home?signedIn=1',
    );
  });
});
