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

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

const { saveProfile } = await import('./profile-actions.service');

const PROFILES = `${TEST_API_BASE_URL}/v1/profiles`;

function typed(fullName: string, displayName: string): FormData {
  const formData = new FormData();
  formData.set('fullName', fullName);
  formData.set('displayName', displayName);
  return formData;
}

function apiRefusesWith(code: string, status: number) {
  server.use(
    http.post(PROFILES, () =>
      HttpResponse.json(
        { error: { code, message: 'Refused.', correlationId: 'c-1' } },
        { status },
      ),
    ),
  );
}

describe('saving the Profile', () => {
  beforeEach(() => {
    requestHeaders.delete('cookie');
  });

  it("sends both names with the browser's cookie, then moves on to Create a Workspace", async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    const seen: Request[] = [];
    server.use(
      http.post(PROFILES, ({ request }) => {
        seen.push(request);
        return HttpResponse.json(
          { id: '0199a0f0-0000-7000-8000-0000000000aa' },
          { status: 201 },
        );
      }),
    );

    await expect(saveProfile({}, typed('Ann Lee', 'Ann'))).rejects.toThrow(
      'redirect:/register/create-workspace',
    );
    expect(seen[0]?.headers.get('cookie')).toBe('thrive.session_token=abc');
    expect(await seen[0]?.json()).toEqual({
      fullName: 'Ann Lee',
      displayName: 'Ann',
    });
  });

  it('puts a refused name beside its field', async () => {
    apiRefusesWith('DISPLAY_NAME_TOO_LONG', 400);

    expect(await saveProfile({}, typed('Ann Lee', 'A'.repeat(51)))).toEqual({
      fieldErrors: { displayName: 'Use 50 characters or fewer.' },
    });
  });

  it('goes home when the Profile was already saved, from another tab or a second click', async () => {
    apiRefusesWith('PROFILE_ALREADY_EXISTS', 409);

    await expect(saveProfile({}, typed('Ann Lee', 'Ann'))).rejects.toThrow(
      'redirect:/home',
    );
  });

  it('sends someone whose session ended to sign in again', async () => {
    apiRefusesWith('NOT_SIGNED_IN', 401);

    await expect(saveProfile({}, typed('Ann Lee', 'Ann'))).rejects.toThrow(
      'redirect:/signin',
    );
  });

  it('asks to try again when the API fails for any other reason', async () => {
    apiRefusesWith('INTERNAL_ERROR', 500);

    expect(await saveProfile({}, typed('Ann Lee', 'Ann'))).toEqual({
      formError: "We couldn't save your details. Please try again.",
    });
  });

  it('asks to try again when the form arrives without the names', async () => {
    expect(await saveProfile({}, new FormData())).toEqual({
      formError: "We couldn't save your details. Please try again.",
    });
  });
});
