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
const INVITATION = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/invitations/${INVITATION_ID}`;
const REVOKE = `${INVITATION}/revoke`;
const RESEND = `${INVITATION}/resend`;
const INVITE = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/invitations`;

const revalidatePath = vi.hoisted(() => vi.fn());

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));
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

function asMember(email: string) {
  return { email, role: 'MEMBER' as const };
}

const { inviteMembers, resendInvitation, revokeInvitation } = await import(
  './invitation-actions.service'
);

function apiRefusesWith(url: string, code: string, status: number) {
  server.use(
    http.post(url, () =>
      HttpResponse.json(
        { error: { code, message: 'Refused.', correlationId: 'c-1' } },
        { status },
      ),
    ),
  );
}

describe('revoking an Invitation from Members', () => {
  it("revokes it in the person's own Workspace, as them, and draws Members again", async () => {
    const seen: Request[] = [];
    server.use(
      http.post(REVOKE, ({ request }) => {
        seen.push(request);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    expect(await revokeInvitation(WORKSPACE_ID, INVITATION_ID)).toEqual({
      ok: true,
    });
    expect(seen[0]?.headers.get('cookie')).toContain(
      'thrive.session_token=abc',
    );
    expect(revalidatePath).toHaveBeenCalledWith('/settings/members');
  });

  it('says why when it was already accepted', async () => {
    apiRefusesWith(REVOKE, 'INVITATION_ALREADY_ACCEPTED', 409);

    expect(await revokeInvitation(WORKSPACE_ID, INVITATION_ID)).toEqual({
      ok: false,
      message: 'They have already joined.',
    });
  });

  it('answers a generic failure for a code it does not explain', async () => {
    apiRefusesWith(REVOKE, 'SOMETHING_ELSE', 500);

    expect(await revokeInvitation(WORKSPACE_ID, INVITATION_ID)).toEqual({
      ok: false,
      message: "We couldn't revoke that Invitation. Please try again.",
    });
  });

  it('never calls the API with something that is not an Invitation id', async () => {
    expect(await revokeInvitation(WORKSPACE_ID, '../members')).toEqual({
      ok: false,
      message: "We couldn't revoke that Invitation. Please try again.",
    });
  });
});

describe('resending an Invitation from Members', () => {
  it("resends it in the person's own Workspace, as them, and draws Members again", async () => {
    const seen: Request[] = [];
    server.use(
      http.post(RESEND, ({ request }) => {
        seen.push(request);
        return HttpResponse.json({
          invitationId: INVITATION_ID,
          expiresAt: '2026-10-20T03:00:00.000Z',
        });
      }),
    );

    expect(await resendInvitation(WORKSPACE_ID, INVITATION_ID)).toEqual({
      ok: true,
    });
    expect(seen[0]?.headers.get('cookie')).toContain(
      'thrive.session_token=abc',
    );
    expect(revalidatePath).toHaveBeenCalledWith('/settings/members');
  });

  it('asks the person to wait when it was sent a moment ago', async () => {
    apiRefusesWith(RESEND, 'INVITATION_RESENT_TOO_SOON', 409);

    expect(await resendInvitation(WORKSPACE_ID, INVITATION_ID)).toEqual({
      ok: false,
      message: 'You sent this a moment ago. Try again in a few minutes.',
    });
  });

  it('answers a generic failure for a code it does not explain', async () => {
    apiRefusesWith(RESEND, 'SOMETHING_ELSE', 500);

    expect(await resendInvitation(WORKSPACE_ID, INVITATION_ID)).toEqual({
      ok: false,
      message: "We couldn't resend that Invitation. Please try again.",
    });
  });
});

describe('inviting teammates from Members', () => {
  it("invites the addresses to the person's own Workspace, as them, and answers each", async () => {
    const seen: Request[] = [];
    server.use(
      http.post(INVITE, async ({ request }) => {
        seen.push(request.clone());
        return HttpResponse.json(
          {
            results: [
              { email: 'ben@acme.test', outcome: 'invited' },
              { email: 'cara@acme.test', outcome: 'already_member' },
            ],
          },
          { status: 201 },
        );
      }),
    );
    revalidatePath.mockClear();

    expect(
      await inviteMembers(WORKSPACE_ID, [
        { email: 'ben@acme.test', role: 'ADMIN' },
        { email: 'cara@acme.test', role: 'MEMBER' },
        { email: 'BEN@acme.test', role: 'MEMBER' },
      ]),
    ).toEqual({
      results: [
        { email: 'ben@acme.test', outcome: 'invited' },
        { email: 'cara@acme.test', outcome: 'already_member' },
      ],
    });
    expect(await seen[0]?.json()).toEqual({
      invitations: [
        { email: 'ben@acme.test', role: 'ADMIN' },
        { email: 'cara@acme.test', role: 'MEMBER' },
      ],
    });
    expect(seen[0]?.headers.get('cookie')).toContain(
      'thrive.session_token=abc',
    );
    expect(revalidatePath).toHaveBeenCalledWith('/settings/members');
  });

  it('checks the list again without calling the API', async () => {
    const seen: Request[] = [];
    server.use(
      http.post(INVITE, ({ request }) => {
        seen.push(request);
        return HttpResponse.json({ results: [] }, { status: 201 });
      }),
    );

    expect(await inviteMembers(WORKSPACE_ID, [asMember('ben')])).toEqual({
      formError: 'Not an email address: ben',
    });
    expect(await inviteMembers(WORKSPACE_ID, [])).toEqual({
      formError: 'Add at least one email address.',
    });
    expect(seen).toHaveLength(0);
  });

  it('says why when the person may not invite', async () => {
    apiRefusesWith(INVITE, 'NOT_ALLOWED_TO_INVITE', 403);

    expect(
      await inviteMembers(WORKSPACE_ID, [asMember('ben@acme.test')]),
    ).toEqual({
      formError: 'Only Admins can send Invitations.',
    });
  });

  it('answers a generic failure for a code it does not explain', async () => {
    apiRefusesWith(INVITE, 'SOMETHING_ELSE', 500);

    expect(
      await inviteMembers(WORKSPACE_ID, [asMember('ben@acme.test')]),
    ).toEqual({
      formError: "We couldn't send your Invitations. Please try again.",
    });
  });

  it('sends someone signed out to sign in', async () => {
    apiRefusesWith(INVITE, 'NOT_SIGNED_IN', 401);

    await expect(
      inviteMembers(WORKSPACE_ID, [asMember('ben@acme.test')]),
    ).rejects.toThrow('redirect:/signin');
  });
});
