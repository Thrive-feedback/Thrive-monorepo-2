/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs: in jsdom, MSW would keep a browser cookie jar
 * and send one test's cookies with the next test's requests.
 */
import { HttpResponse, http } from 'msw';
import { revalidatePath } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

const requestHeaders = new Headers();

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

const { acceptInvitation } = await import('./invitation-actions.service');

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000001';
const ACCEPT = `${TEST_API_BASE_URL}/v1/invitations/${INVITATION_ID}/accept`;

/** The status the API answers each refusal with, where it is not 409. */
const STATUS_OF: Readonly<Record<string, number>> = {
  INVITATION_NOT_FOUND: 404,
  INVITATION_NOT_FOR_YOU: 403,
};

function chose(invitationId: string): FormData {
  const formData = new FormData();
  formData.set('invitationId', invitationId);
  return formData;
}

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

describe('joining the chosen Workspace', () => {
  beforeEach(() => {
    requestHeaders.delete('cookie');
    vi.mocked(revalidatePath).mockClear();
  });

  it("accepts the Invitation with the browser's cookie, then goes Home", async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    const seen: Request[] = [];
    server.use(
      http.post(ACCEPT, ({ request }) => {
        seen.push(request);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(acceptInvitation({}, chose(INVITATION_ID))).rejects.toThrow(
      'redirect:/home',
    );
    expect(seen[0]?.headers.get('cookie')).toBe('thrive.session_token=abc');
  });

  it.each([
    'INVITATION_NOT_FOUND',
    'INVITATION_EXPIRED',
    'INVITATION_REVOKED',
    'INVITATION_ALREADY_ACCEPTED',
    'INVITATION_NOT_FOR_YOU',
  ])(
    'says so in place, and reads the list again, when the API answers %s',
    async (code) => {
      apiRefusesWith(code, STATUS_OF[code] ?? 409);

      expect(await acceptInvitation({}, chose(INVITATION_ID))).toEqual({
        refusal: 'noLongerPending',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/register/join-workspace');
    },
  );

  it('sends someone whose session ended to sign-in', async () => {
    apiRefusesWith('NOT_SIGNED_IN', 401);

    await expect(acceptInvitation({}, chose(INVITATION_ID))).rejects.toThrow(
      'redirect:/signin',
    );
  });

  it('says it could not join when the API fails otherwise', async () => {
    apiRefusesWith('INTERNAL_ERROR', 500);

    expect(await acceptInvitation({}, chose(INVITATION_ID))).toEqual({
      refusal: 'failed',
    });
  });

  it('sends nothing for a value that is not an Invitation id', async () => {
    expect(await acceptInvitation({}, chose('../../v1/workspaces'))).toEqual({
      refusal: 'failed',
    });
  });
});
