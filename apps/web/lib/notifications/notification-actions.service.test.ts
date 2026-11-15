/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs: in jsdom, MSW would keep a browser cookie jar and
 * send one test's cookies with the next test's requests.
 */
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markPlaceOpened,
  readBell,
} = await import('./notification-actions.service');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const NOTIFICATION_ID = '0199a0f0-0000-7000-8000-0000000000bb';

/** Every path the API was asked for, in order, so a wasted call is visible. */
let asked: string[] = [];

beforeEach(() => {
  asked = [];
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/sessions/current`, ({ request }) => {
      asked.push(new URL(request.url).pathname);
      return HttpResponse.json({ account: null });
    }),
    http.get(`${TEST_API_BASE_URL}/v1/members/mine/current`, ({ request }) => {
      asked.push(new URL(request.url).pathname);
      return HttpResponse.json({
        membership: {
          workspace: { id: WORKSPACE_ID, name: 'Acme' },
          role: 'MEMBER',
        },
      });
    }),
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/notifications`,
      ({ request }) => {
        asked.push(new URL(request.url).pathname);
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
        });
      },
    ),
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/notifications/unread-count`,
      ({ request }) => {
        asked.push(new URL(request.url).pathname);
        return HttpResponse.json({ count: 2 });
      },
    ),
    http.get(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/me/counts`,
      ({ request }) => {
        asked.push(new URL(request.url).pathname);
        return HttpResponse.json({
          waitingAsks: 0,
          newAnswers: 0,
          newOffered: 0,
          newKudos: 0,
          newShared: 0,
        });
      },
    ),
    http.post(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/notifications/read`,
      ({ request }) => {
        asked.push(new URL(request.url).pathname);
        return new HttpResponse(null, { status: 204 });
      },
    ),
    http.post(
      `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/notifications/${NOTIFICATION_ID}/read`,
      ({ request }) => {
        asked.push(new URL(request.url).pathname);
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
});

/**
 * The browser cannot reach the API, so every one of these is a hop the person waits through
 * (#269). Reading the session as well as the membership is one more of them, for a fact that is
 * then thrown away.
 */
describe('what each action costs the person waiting', () => {
  it('lists notifications without reading the session as well', async () => {
    await listMyNotifications();

    expect(asked).toEqual([
      '/v1/members/mine/current',
      `/v1/workspaces/${WORKSPACE_ID}/notifications`,
    ]);
  });

  it('reads a whole poll after one read of the Workspace, the three reads together', async () => {
    await readBell();

    expect(asked[0]).toBe('/v1/members/mine/current');
    expect(asked.slice(1).sort()).toEqual(
      [
        `/v1/workspaces/${WORKSPACE_ID}/me/counts`,
        `/v1/workspaces/${WORKSPACE_ID}/notifications`,
        `/v1/workspaces/${WORKSPACE_ID}/notifications/unread-count`,
      ].sort(),
    );
  });

  it('marks one read without reading the session as well', async () => {
    await markNotificationRead(NOTIFICATION_ID);

    expect(asked).toEqual([
      '/v1/members/mine/current',
      `/v1/workspaces/${WORKSPACE_ID}/notifications/${NOTIFICATION_ID}/read`,
    ]);
  });

  it('marks everything read without reading the session as well', async () => {
    await markAllNotificationsRead();

    expect(asked).toEqual([
      '/v1/members/mine/current',
      `/v1/workspaces/${WORKSPACE_ID}/notifications/read`,
    ]);
  });
});

describe('reading the bell', () => {
  it('asks for the page it is given, as many lines to a page as the API gives at once', async () => {
    let query = new URLSearchParams();
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/notifications`,
        ({ request }) => {
          query = new URL(request.url).searchParams;
          return HttpResponse.json({
            items: [],
            total: 250,
            page: 3,
            pageSize: 100,
          });
        },
      ),
    );

    expect(await listMyNotifications(3)).toEqual({ items: [], total: 250 });
    expect(query.get('page')).toBe('3');
    expect(query.get('pageSize')).toBe('100');
  });

  it('asks for the newest page when given none', async () => {
    let page: string | null = null;
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/notifications`,
        ({ request }) => {
          page = new URL(request.url).searchParams.get('page');
          return HttpResponse.json({
            items: [],
            total: 0,
            page: 1,
            pageSize: 100,
          });
        },
      ),
    );

    await listMyNotifications();

    expect(page).toBe('1');
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'asks nothing for page %s, which no bell would send',
    async (page) => {
      await expect(listMyNotifications(page)).resolves.toBeNull();
      expect(asked).toEqual([]);
    },
  );

  it('answers how many are unread, with the newest page', async () => {
    const read = await readBell();

    expect(read.count).toBe(2);
    expect(read.page).toEqual({ items: [], total: 0 });
  });

  it('answers the parts it could read when another is refused', async () => {
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/notifications/unread-count`,
        () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR' } },
            { status: 500 },
          ),
      ),
    );

    const read = await readBell();

    expect(read.count).toBeNull();
    expect(read.page).toEqual({ items: [], total: 0 });
    expect(read.counts).not.toBeNull();
  });

  it('turns each line the API sends into what the bell draws, face included', async () => {
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/notifications`,
        () =>
          HttpResponse.json({
            items: [
              {
                id: NOTIFICATION_ID,
                type: 'FEEDBACK_SHARED',
                actor: {
                  accountId: '0199a0f0-0000-7000-8000-0000000000c1',
                  name: 'Ann Lee',
                  photoUrl: 'https://lh3.example/a=s96-c',
                },
                subjectId: '0199a0f0-0000-7000-8000-0000000000d1',
                createdAt: '2026-11-14T03:00:00.000Z',
                readAt: null,
              },
              {
                id: '0199a0f0-0000-7000-8000-0000000000b2',
                type: 'ASK_RECEIVED',
                actor: {
                  accountId: '0199a0f0-0000-7000-8000-0000000000c2',
                  name: null,
                  photoUrl: null,
                },
                subjectId: '0199a0f0-0000-7000-8000-0000000000d2',
                createdAt: '2026-11-13T03:00:00.000Z',
                readAt: '2026-11-13T04:00:00.000Z',
              },
            ],
            total: 2,
            page: 1,
            pageSize: 10,
          }),
      ),
    );

    expect(await listMyNotifications()).toEqual({
      total: 2,
      items: [
        {
          id: NOTIFICATION_ID,
          type: 'FEEDBACK_SHARED',
          actorName: 'Ann Lee',
          actorPhotoUrl: 'https://lh3.example/a=s96-c',
          subjectId: '0199a0f0-0000-7000-8000-0000000000d1',
          createdAt: '2026-11-14T03:00:00.000Z',
          isRead: false,
        },
        {
          id: '0199a0f0-0000-7000-8000-0000000000b2',
          type: 'ASK_RECEIVED',
          actorName: null,
          actorPhotoUrl: null,
          subjectId: '0199a0f0-0000-7000-8000-0000000000d2',
          createdAt: '2026-11-13T03:00:00.000Z',
          isRead: true,
        },
      ],
    });
  });
});

describe('when the session has expired', () => {
  beforeEach(() => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/v1/members/mine/current`, () =>
        HttpResponse.json({ membership: null }),
      ),
      http.get(`${TEST_API_BASE_URL}/v1/sessions/current`, () =>
        HttpResponse.json({ account: null }),
      ),
    );
  });

  it('sends them to sign in rather than telling them to try again forever', async () => {
    // `readCurrentMembership` answers null for no Workspace and for no session alike. Somebody
    // whose session has expired must not be left pressing a bell that can never work.
    await expect(listMyNotifications()).rejects.toThrow(/NEXT_REDIRECT/);
    await expect(readBell()).rejects.toThrow(/NEXT_REDIRECT/);
    await expect(markAllNotificationsRead()).rejects.toThrow(/NEXT_REDIRECT/);
  });
});

describe('when the session is in no Workspace at all', () => {
  beforeEach(() => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/v1/members/mine/current`, () =>
        HttpResponse.json({ membership: null }),
      ),
      // Signed in, just not in a Workspace — somebody between Workspaces, or just Deactivated.
      http.get(`${TEST_API_BASE_URL}/v1/sessions/current`, () =>
        HttpResponse.json({
          account: {
            accountId: '0199a0f0-0000-7000-8000-00000000000c',
            email: 'ann@acme.test',
            fullName: 'Ann Lee',
            profile: null,
          },
        }),
      ),
    );
  });

  it('says it could not look, rather than asking about a Workspace it does not have', async () => {
    // Somebody between Workspaces is not an error, and there is nothing to ask about.
    await expect(listMyNotifications()).resolves.toBeNull();
    await expect(readBell()).resolves.toEqual({
      count: null,
      page: null,
      counts: null,
    });
    await expect(markAllNotificationsRead()).resolves.toBe(false);
    await expect(
      markNotificationRead(NOTIFICATION_ID),
    ).resolves.toBeUndefined();
  });
});

describe('the counts beside Waiting for me, Received and Shared with me', () => {
  it('reads them from the things themselves, named for where the navigation draws them', async () => {
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/me/counts`,
        ({ request }) => {
          asked.push(new URL(request.url).pathname);
          return HttpResponse.json({
            waitingAsks: 3,
            newAnswers: 2,
            newOffered: 1,
            newKudos: 4,
            newShared: 5,
          });
        },
      ),
    );

    expect((await readBell()).counts).toEqual({
      waiting: 3,
      requests: 2,
      offered: 1,
      kudos: 4,
      shared: 5,
    });
  });

  it('says it could not find out when the API refuses, so the numbers on screen stay', async () => {
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/me/counts`,
        () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR' } },
            { status: 500 },
          ),
      ),
    );

    expect((await readBell()).counts).toBeNull();
  });

  /** What each write was sent with, by the path it was sent to. */
  function sentOnOpening() {
    const sent: Record<string, unknown> = {};
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/me/seen`,
        async ({ request }) => {
          sent.seen = await request.json();
          return new HttpResponse(null, { status: 204 });
        },
      ),
      http.post(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/notifications/read`,
        async ({ request }) => {
          sent.read = await request.json();
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );
    return sent;
  }

  it.each([
    ['requests', 'RECEIVED_REQUESTS', 'ASK_ANSWERED'],
    ['offered', 'RECEIVED_OFFERED', 'FEEDBACK_RECEIVED'],
    ['kudos', 'RECEIVED_KUDOS', 'KUDOS_RECEIVED'],
    ['shared', 'SHARED_WITH_ME', 'FEEDBACK_SHARED'],
  ] as const)(
    'marks %s opened as the API names it, and reads the bell lines that lead there',
    async (place, list, kind) => {
      const sent = sentOnOpening();

      await markPlaceOpened(place);

      expect(sent).toEqual({ seen: { list }, read: { types: [kind] } });
    },
  );

  it('reads the lines about being asked when Waiting for me opens, and leaves its count alone', async () => {
    const sent = sentOnOpening();

    await markPlaceOpened('waiting');

    expect(sent).toEqual({ read: { types: ['ASK_RECEIVED'] } });
  });

  it.each(['all', 'ALL', 'everything', 42, null])(
    'asks nothing for %s, which is not one list with a count',
    async (place) => {
      // A server action is a public endpoint: the browser can send it anything.
      // @ts-expect-error — not one of the places this bundle would send.
      await expect(markPlaceOpened(place)).resolves.toBeUndefined();
      expect(asked).toEqual([]);
    },
  );

  it('still reads the bell lines when marking the list seen is refused, and does not fail', async () => {
    const sent = sentOnOpening();
    server.use(
      http.post(
        `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/me/seen`,
        () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR' } },
            { status: 500 },
          ),
      ),
    );

    await expect(markPlaceOpened('kudos')).resolves.toBeUndefined();
    expect(sent.read).toEqual({ types: ['KUDOS_RECEIVED'] });
  });
});
