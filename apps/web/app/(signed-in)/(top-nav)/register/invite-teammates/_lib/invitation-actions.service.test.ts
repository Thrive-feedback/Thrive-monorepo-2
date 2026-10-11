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
const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock('@/lib/session/session.service', () => ({
  requireMember: async () => ({
    membership: {
      workspace: { id: WORKSPACE_ID, name: 'Acme' },
      role: 'OWNER',
    },
  }),
}));

const { sendInvitations } = await import('./invitation-actions.service');

const INVITATIONS = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/invitations`;

function apiRefusesWith(code: string, status: number) {
  server.use(
    http.post(INVITATIONS, () =>
      HttpResponse.json(
        { error: { code, message: 'Refused.', correlationId: 'c-1' } },
        { status },
      ),
    ),
  );
}

describe('sending the Invitations', () => {
  beforeEach(() => {
    requestHeaders.delete('cookie');
  });

  it("invites into the person's own Workspace with the browser's cookie, and answers each address", async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    const seen: Request[] = [];
    server.use(
      http.post(INVITATIONS, ({ request }) => {
        seen.push(request);
        return HttpResponse.json({
          results: [
            {
              email: 'ben@acme.co',
              outcome: 'invited',
              invitationId: '0199a0f0-0000-7000-8000-000000000001',
              expiresAt: '2026-10-17T03:00:00.000Z',
            },
            { email: 'cat@acme.co', outcome: 'failed' },
          ],
        });
      }),
    );

    const sent = await sendInvitations(['ben@acme.co', 'cat@acme.co']);

    expect(sent).toEqual({
      results: [
        { email: 'ben@acme.co', outcome: 'invited' },
        { email: 'cat@acme.co', outcome: 'failed' },
      ],
    });
    expect(seen[0]?.headers.get('cookie')).toBe('thrive.session_token=abc');
    expect(await seen[0]?.json()).toEqual({
      emails: ['ben@acme.co', 'cat@acme.co'],
    });
  });

  it('says only the Owner and Admins can invite when the API refuses the role', async () => {
    apiRefusesWith('NOT_ALLOWED_TO_INVITE', 403);

    expect(await sendInvitations(['ben@acme.co'])).toEqual({
      formError: 'Only the Owner and Admins can invite teammates.',
    });
  });

  it('sends someone whose session ended to sign in', async () => {
    apiRefusesWith('NOT_SIGNED_IN', 401);

    await expect(sendInvitations(['ben@acme.co'])).rejects.toThrow(
      'redirect:/signin',
    );
  });

  it('sends someone no longer in the Workspace Home', async () => {
    apiRefusesWith('WORKSPACE_NOT_FOUND', 404);

    await expect(sendInvitations(['ben@acme.co'])).rejects.toThrow(
      'redirect:/home',
    );
  });

  it('asks to try again on any other failure', async () => {
    apiRefusesWith('INTERNAL_ERROR', 500);

    expect(await sendInvitations(['ben@acme.co'])).toEqual({
      formError: "We couldn't send your invitations. Please try again.",
    });
  });

  it('sends nothing for an empty list', async () => {
    expect(await sendInvitations([])).toEqual({
      formError: "We couldn't send your invitations. Please try again.",
    });
  });
});
