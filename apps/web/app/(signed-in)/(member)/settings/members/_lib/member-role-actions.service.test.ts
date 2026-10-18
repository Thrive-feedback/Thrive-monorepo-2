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
const BEN_ID = '0199a0f0-0000-7000-8000-000000000002';
const BEN = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/members/${BEN_ID}`;

const revalidatePath = vi.hoisted(() => vi.fn());

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock('@/lib/session/session.service', () => ({
  requireMemberOf: async () => ({
    membership: {
      workspace: { id: WORKSPACE_ID, name: 'Acme' },
      role: 'ADMIN',
    },
  }),
}));

const { changeMemberRole } = await import('./member-role-actions.service');

function apiRefusesWith(code: string, status: number) {
  server.use(
    http.patch(BEN, () =>
      HttpResponse.json(
        { error: { code, message: 'Refused.', correlationId: 'c-1' } },
        { status },
      ),
    ),
  );
}

describe('changing a Role from Members', () => {
  it("changes it in the person's own Workspace, as them, and draws Members again", async () => {
    const seen: { cookie: string | null; body: unknown }[] = [];
    server.use(
      http.patch(BEN, async ({ request }) => {
        seen.push({
          cookie: request.headers.get('cookie'),
          body: await request.json(),
        });
        return new HttpResponse(null, { status: 204 });
      }),
    );

    expect(await changeMemberRole(WORKSPACE_ID, BEN_ID, 'ADMIN')).toEqual({
      ok: true,
    });
    expect(seen).toEqual([
      {
        cookie: expect.stringContaining('thrive.session_token=abc'),
        body: { role: 'ADMIN' },
      },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith('/settings/members');
  });

  it('says to make someone else an Admin first when it would leave none', async () => {
    apiRefusesWith('LAST_ADMIN', 409);

    expect(await changeMemberRole(WORKSPACE_ID, BEN_ID, 'MEMBER')).toEqual({
      ok: false,
      message: 'Make someone else an Admin first.',
    });
  });

  it('says only Admins can change Roles when the person is no longer one', async () => {
    apiRefusesWith('NOT_ALLOWED_TO_CHANGE_ROLES', 403);

    expect(await changeMemberRole(WORKSPACE_ID, BEN_ID, 'ADMIN')).toEqual({
      ok: false,
      message: 'Only Admins can change Roles.',
    });
  });

  it('answers a generic failure for a code it does not explain', async () => {
    apiRefusesWith('SOMETHING_ELSE', 500);

    expect(await changeMemberRole(WORKSPACE_ID, BEN_ID, 'ADMIN')).toEqual({
      ok: false,
      message: "We couldn't change their Role. Please try again.",
    });
  });

  it('never calls the API with something that is not an Account id', async () => {
    expect(
      await changeMemberRole(WORKSPACE_ID, '../invitations', 'ADMIN'),
    ).toEqual({
      ok: false,
      message: "We couldn't change their Role. Please try again.",
    });
  });
});
