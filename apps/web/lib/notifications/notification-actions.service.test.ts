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
  countUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
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

  it('counts the unread the same way, as it already did', async () => {
    await countUnreadNotifications();

    expect(asked).toEqual([
      '/v1/members/mine/current',
      `/v1/workspaces/${WORKSPACE_ID}/notifications/unread-count`,
    ]);
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
    await expect(countUnreadNotifications()).resolves.toBeNull();
    await expect(markAllNotificationsRead()).resolves.toBe(false);
    await expect(
      markNotificationRead(NOTIFICATION_ID),
    ).resolves.toBeUndefined();
  });
});
