/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs: in jsdom, MSW would keep a browser cookie jar
 * and send one test's cookies with the next test's requests.
 */
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000003';
const REVOKE = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/invitations/${INVITATION_ID}/revoke`;

const revalidatePath = vi.hoisted(() => vi.fn());

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock('@/lib/session/session.service', () => ({
  requireMember: async () => ({
    membership: {
      workspace: { id: WORKSPACE_ID, name: 'Acme' },
      role: 'OWNER',
    },
  }),
}));

const { revokeInvitation } = await import('./invitation-actions.service');

function apiRefusesWith(code: string, status: number) {
  server.use(
    http.post(REVOKE, () =>
      HttpResponse.json(
        { error: { code, message: 'Refused.', correlationId: 'c-1' } },
        { status },
      ),
    ),
  );
}

describe('revoking an Invitation from Home', () => {
  it("revokes it in the person's own Workspace, as them, and draws Home again", async () => {
    const seen: Request[] = [];
    server.use(
      http.post(REVOKE, ({ request }) => {
        seen.push(request);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    expect(await revokeInvitation(INVITATION_ID)).toEqual({ ok: true });
    expect(seen[0]?.headers.get('cookie')).toContain(
      'thrive.session_token=abc',
    );
    expect(revalidatePath).toHaveBeenCalledWith('/home');
  });

  it('says why when it was already accepted', async () => {
    apiRefusesWith('INVITATION_ALREADY_ACCEPTED', 409);

    expect(await revokeInvitation(INVITATION_ID)).toEqual({
      ok: false,
      message: 'They have already joined.',
    });
  });

  it('answers a generic failure for a code it does not explain', async () => {
    apiRefusesWith('SOMETHING_ELSE', 500);

    expect(await revokeInvitation(INVITATION_ID)).toEqual({
      ok: false,
      message: "We couldn't revoke that invitation. Please try again.",
    });
  });

  it('never calls the API with something that is not an Invitation id', async () => {
    expect(await revokeInvitation('../members')).toEqual({
      ok: false,
      message: "We couldn't revoke that invitation. Please try again.",
    });
  });
});
