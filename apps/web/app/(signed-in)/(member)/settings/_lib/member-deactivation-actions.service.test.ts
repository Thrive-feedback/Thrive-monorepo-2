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
const DEACTIVATE_BEN = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/members/${BEN_ID}/deactivate`;

const revalidatePath = vi.hoisted(() => vi.fn());

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock('@/lib/session/session.service', () => ({
  requireMemberOf: async () => ({
    membership: {
      workspace: { id: WORKSPACE_ID, name: 'Acme' },
      role: 'ADMIN',
    },
  }),
}));

const { deactivateMember, leaveWorkspace } = await import(
  './member-deactivation-actions.service'
);

function apiDeactivates(seen: Request[] = []) {
  server.use(
    http.post(DEACTIVATE_BEN, ({ request }) => {
      seen.push(request);
      return new HttpResponse(null, { status: 204 });
    }),
  );
}

function apiRefusesWith(code: string, status: number) {
  server.use(
    http.post(DEACTIVATE_BEN, () =>
      HttpResponse.json(
        { error: { code, message: 'Refused.', correlationId: 'c-1' } },
        { status },
      ),
    ),
  );
}

describe('Deactivating someone from Members', () => {
  it("Deactivates them in the person's own Workspace, as them, and draws Members again", async () => {
    const seen: Request[] = [];
    apiDeactivates(seen);

    expect(await deactivateMember(WORKSPACE_ID, BEN_ID)).toEqual({ ok: true });
    expect(seen[0]?.headers.get('cookie')).toContain(
      'thrive.session_token=abc',
    );
    expect(revalidatePath).toHaveBeenCalledWith('/settings/members');
  });

  it('says only Admins may when the person is not one', async () => {
    apiRefusesWith('NOT_ALLOWED_TO_DEACTIVATE', 403);

    expect(await deactivateMember(WORKSPACE_ID, BEN_ID)).toEqual({
      ok: false,
      message: 'Only Admins can Deactivate other people.',
    });
  });

  it('says they are gone when they already left', async () => {
    apiRefusesWith('MEMBER_NOT_FOUND', 404);

    expect(await deactivateMember(WORKSPACE_ID, BEN_ID)).toEqual({
      ok: false,
      message: 'They are no longer in this Workspace.',
    });
  });

  it('never calls the API with something that is not an Account id', async () => {
    expect(await deactivateMember(WORKSPACE_ID, '../sessions')).toEqual({
      ok: false,
      message: "We couldn't do that. Please try again.",
    });
  });
});

describe('leaving from Members', () => {
  it('sends the person on to wherever they belong once they are out', async () => {
    apiDeactivates();

    await expect(leaveWorkspace(WORKSPACE_ID, BEN_ID)).rejects.toThrow(
      'redirect:/home',
    );
  });

  it('says to make someone else an Admin first, and stays, for the only Admin', async () => {
    apiRefusesWith('LAST_ADMIN', 409);

    expect(await leaveWorkspace(WORKSPACE_ID, BEN_ID)).toEqual({
      ok: false,
      message: 'Make someone else an Admin first.',
    });
  });
});
