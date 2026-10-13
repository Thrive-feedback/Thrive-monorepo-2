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
  landingFor,
  readSession,
  readSessionNeedsRefresh,
  requireAccountToCreateWorkspace,
  requireAccountToIntroduce,
  requireInvitationsToJoin,
  requireMember,
} = await import('./session.service');

const CURRENT_SESSION = `${TEST_API_BASE_URL}/v1/sessions/current`;
const MY_MEMBERSHIPS = `${TEST_API_BASE_URL}/v1/members/mine`;
const MY_INVITATIONS = `${TEST_API_BASE_URL}/v1/invitations/mine`;
const ANN_PROFILE = { fullName: 'Ann Lee', displayName: 'Ann', slug: 'ann' };
const ACME = {
  workspace: { id: '0199a0f0-0000-7000-8000-0000000000w1', name: 'Acme Corp' },
  role: 'OWNER' as const,
};
const ANN = { email: 'ann@acme.test', name: 'Ann Lee' };
const TO_GLOBEX = {
  invitationId: '0199a0f0-0000-7000-8000-000000000001',
  workspace: {
    id: '0199a0f0-0000-7000-8000-0000000000w2',
    name: 'Globex',
    memberCount: 4,
  },
  invitedAt: '2026-10-10T03:00:00.000Z',
  expiresAt: '2026-10-17T03:00:00.000Z',
};
const GLOBEX_INVITATION = {
  invitationId: TO_GLOBEX.invitationId,
  workspace: { name: 'Globex', memberCount: 4 },
  invitedAt: new Date(TO_GLOBEX.invitedAt),
};

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
    http.get(MY_MEMBERSHIPS, () =>
      HttpResponse.json(
        {
          error: {
            code: 'NOT_SIGNED_IN',
            message: 'Sign in to do this.',
            correlationId: 'c-1',
          },
        },
        { status: 401 },
      ),
    ),
  );
}

function answerMemberOf(membership: typeof ACME | null) {
  server.use(
    http.get(MY_MEMBERSHIPS, () =>
      HttpResponse.json({
        items: membership ? [membership] : [],
        total: membership ? 1 : 0,
        page: 1,
        pageSize: 1,
      }),
    ),
  );
}

function answerInvitedTo(invitations: (typeof TO_GLOBEX)[]) {
  server.use(
    http.get(MY_INVITATIONS, () =>
      HttpResponse.json({
        items: invitations,
        total: invitations.length,
        page: 1,
        pageSize: 100,
      }),
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

describe('landingFor', () => {
  it('sends someone who has not introduced themselves to Introduce yourself', () => {
    expect(landingFor({ ...ANN, profile: null }, null, []).page).toBe(
      'introduceYourself',
    );
  });

  it('sends someone introduced, in no Workspace and invited nowhere to Create a Workspace', () => {
    expect(landingFor({ ...ANN, profile: ANN_PROFILE }, null, []).page).toBe(
      'createWorkspace',
    );
  });

  it('sends someone introduced, in no Workspace and invited to one to choose whether to join', () => {
    expect(
      landingFor({ ...ANN, profile: ANN_PROFILE }, null, [GLOBEX_INVITATION]),
    ).toEqual({
      page: 'joinWorkspace',
      account: { ...ANN, profile: ANN_PROFILE },
      invitations: [GLOBEX_INVITATION],
    });
  });

  it('sends a Member of a Workspace Home, whatever they are invited to', () => {
    expect(
      landingFor({ ...ANN, profile: ANN_PROFILE }, ACME, [GLOBEX_INVITATION]),
    ).toEqual({
      page: 'home',
      account: { ...ANN, profile: ANN_PROFILE, membership: ACME },
    });
  });
});

describe('requireMember', () => {
  beforeEach(() => {
    requestHeaders.delete('cookie');
  });

  it("asks for the person's Workspace with the browser's cookie", async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    answerSignedInAs(ANN_PROFILE);
    const seen: Request[] = [];
    server.use(
      http.get(MY_MEMBERSHIPS, ({ request }) => {
        seen.push(request);
        return HttpResponse.json({
          items: [ACME],
          total: 1,
          page: 1,
          pageSize: 1,
        });
      }),
    );

    await requireMember();

    expect(seen[0]?.headers.get('cookie')).toBe('thrive.session_token=abc');
  });

  it('answers a Member with their Workspace and Role', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(ACME);

    expect(await requireMember()).toEqual({
      ...ANN,
      profile: ANN_PROFILE,
      membership: ACME,
    });
  });

  it('sends a signed-out visitor to sign-in', async () => {
    answerSignedOut();

    await expect(requireMember()).rejects.toThrow('redirect:/signin');
  });

  it('sends someone who has not introduced themselves to Introduce yourself', async () => {
    answerSignedInAs(null);
    answerMemberOf(null);

    await expect(requireMember()).rejects.toThrow(
      'redirect:/register/introduce-yourself',
    );
  });

  it('sends someone in no Workspace to Create a Workspace', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(null);
    answerInvitedTo([]);

    await expect(requireMember()).rejects.toThrow(
      'redirect:/register/create-workspace',
    );
  });

  it('sends someone in no Workspace with an Invitation waiting to choose whether to join', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(null);
    answerInvitedTo([TO_GLOBEX]);

    await expect(requireMember()).rejects.toThrow(
      'redirect:/register/join-workspace',
    );
  });

  it('keeps "just signed in" across that redirect, so the toast still shows', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(null);
    answerInvitedTo([]);

    await expect(requireMember('1')).rejects.toThrow(
      'redirect:/register/create-workspace?signedIn=1',
    );
  });

  it("fails with the API's error code when reading the Workspace fails", async () => {
    answerSignedInAs(ANN_PROFILE);
    server.use(
      http.get(MY_MEMBERSHIPS, () =>
        HttpResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Something went wrong.',
              correlationId: 'c-2',
            },
          },
          { status: 500 },
        ),
      ),
    );

    await expect(requireMember()).rejects.toMatchObject({
      constructor: ApiError,
      code: 'INTERNAL_ERROR',
    });
  });
});

describe('requireAccountToIntroduce', () => {
  it('answers the Account of someone who has not introduced themselves', async () => {
    answerSignedInAs(null);
    answerMemberOf(null);

    expect(await requireAccountToIntroduce()).toEqual({
      ...ANN,
      profile: null,
    });
  });

  it('sends a signed-out visitor to sign-in', async () => {
    answerSignedOut();

    await expect(requireAccountToIntroduce()).rejects.toThrow(
      'redirect:/signin',
    );
  });

  it('sends someone introduced but in no Workspace on to Create a Workspace', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(null);
    answerInvitedTo([]);

    await expect(requireAccountToIntroduce()).rejects.toThrow(
      'redirect:/register/create-workspace',
    );
  });

  it('sends a Member home, keeping "just signed in"', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(ACME);

    await expect(requireAccountToIntroduce('1')).rejects.toThrow(
      'redirect:/home?signedIn=1',
    );
  });
});

describe('requireAccountToCreateWorkspace', () => {
  it('answers someone introduced but in no Workspace', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(null);
    answerInvitedTo([]);

    expect(await requireAccountToCreateWorkspace()).toEqual({
      ...ANN,
      profile: ANN_PROFILE,
    });
  });

  it('answers someone who chose to create one over the Invitations waiting for them', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(null);
    answerInvitedTo([TO_GLOBEX]);

    expect(await requireAccountToCreateWorkspace()).toEqual({
      ...ANN,
      profile: ANN_PROFILE,
    });
  });

  it('sends a signed-out visitor to sign-in', async () => {
    answerSignedOut();

    await expect(requireAccountToCreateWorkspace()).rejects.toThrow(
      'redirect:/signin',
    );
  });

  it('sends someone who has not introduced themselves to Introduce yourself first', async () => {
    answerSignedInAs(null);
    answerMemberOf(null);

    await expect(requireAccountToCreateWorkspace()).rejects.toThrow(
      'redirect:/register/introduce-yourself',
    );
  });

  it('sends a Member who opens it directly to their Home', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(ACME);

    await expect(requireAccountToCreateWorkspace()).rejects.toThrow(
      'redirect:/home',
    );
  });
});

describe('requireInvitationsToJoin', () => {
  beforeEach(() => {
    requestHeaders.delete('cookie');
  });

  it("answers the Invitations waiting, asked for with the browser's cookie", async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(null);
    const seen: Request[] = [];
    server.use(
      http.get(MY_INVITATIONS, ({ request }) => {
        seen.push(request);
        return HttpResponse.json({
          items: [TO_GLOBEX],
          total: 1,
          page: 1,
          pageSize: 100,
        });
      }),
    );

    expect(await requireInvitationsToJoin()).toEqual([GLOBEX_INVITATION]);
    expect(seen[0]?.headers.get('cookie')).toBe('thrive.session_token=abc');
  });

  it('sends someone with no Invitation waiting on to Create a Workspace', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(null);
    answerInvitedTo([]);

    await expect(requireInvitationsToJoin()).rejects.toThrow(
      'redirect:/register/create-workspace',
    );
  });

  it('sends someone whose session ended while reading on to Create a Workspace, which sends them to sign in', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(null);
    server.use(
      http.get(MY_INVITATIONS, () =>
        HttpResponse.json(
          {
            error: {
              code: 'NOT_SIGNED_IN',
              message: 'Sign in to do this.',
              correlationId: 'c-3',
            },
          },
          { status: 401 },
        ),
      ),
    );

    await expect(requireInvitationsToJoin()).rejects.toThrow(
      'redirect:/register/create-workspace',
    );
  });

  it("fails with the API's error code when reading the Invitations fails, rather than hide them", async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(null);
    server.use(
      http.get(MY_INVITATIONS, () =>
        HttpResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Something went wrong.',
              correlationId: 'c-4',
            },
          },
          { status: 500 },
        ),
      ),
    );

    await expect(requireAccountToCreateWorkspace()).rejects.toMatchObject({
      constructor: ApiError,
      code: 'INTERNAL_ERROR',
    });
  });

  it('sends a Member Home without asking for Invitations', async () => {
    answerSignedInAs(ANN_PROFILE);
    answerMemberOf(ACME);

    await expect(requireInvitationsToJoin()).rejects.toThrow('redirect:/home');
  });
});
