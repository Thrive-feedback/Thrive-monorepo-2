'use server';

import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import {
  readCurrentMembership,
  readSession,
} from '@/lib/session/session.service';
import type {
  CountedPlace,
  PlaceCounts,
  SeenPlace,
} from './navigation-counts.type';
import type { BellRead, NotificationsPage } from './notification.type';
import { typesReadIn } from './notification-copy.constant';
import { NOTIFICATIONS_PAGE_SIZE } from './notification-page.constant';

const NotificationId = z.uuid();

/** The page asked for comes from the browser, so it is checked before it is sent on. */
const PageNumber = z.int().positive();

const SEEN_LIST_ON_THE_WIRE = {
  requests: 'RECEIVED_REQUESTS',
  offered: 'RECEIVED_OFFERED',
  kudos: 'RECEIVED_KUDOS',
  shared: 'SHARED_WITH_ME',
} as const satisfies Record<SeenPlace, string>;

/** Which page was opened. It comes from the browser, so it is checked before it is sent on. */
const OpenedPlace = z.enum([
  'waiting',
  'requests',
  'offered',
  'kudos',
  'shared',
] satisfies CountedPlace[]);

async function forwardedCookie(): Promise<string | undefined> {
  return (await headers()).get('cookie') ?? undefined;
}

/**
 * The Workspace to ask about: the one this session is in, read from the session on the server.
 * Nothing the browser sends names a Workspace, so there is no request a person could shape that
 * counts somebody else's, or another Workspace's.
 *
 * **`readCurrentMembership`, never `requireMember`.** `requireMember` reads the session as well,
 * which is a second API call for a fact every one of these throws away — and because the browser
 * cannot reach the API, each of those is a hop the person waits through. Design `0022` §4.3 sizes
 * what a poll costs on the same grounds.
 *
 * `null` means there is no Workspace to ask about, which every caller treats as "nothing to say":
 * a bell drawn for somebody between Workspaces is not an error.
 */
async function currentWorkspaceId(): Promise<string | null> {
  const membership = await readCurrentMembership();
  if (membership) {
    return membership.workspace.id;
  }
  // `readCurrentMembership` answers `null` for two different things: a session in no Workspace,
  // and no session at all. Only the second is worth sending somebody somewhere, and telling them
  // apart costs a read nobody pays on the ordinary path — somebody whose session has expired is
  // sent to sign in rather than told to try again in a moment, forever.
  if (!(await readSession())) {
    redirect(ROUTES.signIn);
  }
  return null;
}

/**
 * How many things the person has been told about here and not yet read. `null` when we could not
 * find out: the bell keeps the number it already had rather than dropping to zero.
 */
async function unreadCountIn(
  workspaceId: string,
  cookie: string | undefined,
): Promise<number | null> {
  try {
    return unwrap(
      await apiClient().GET(
        '/v1/workspaces/{workspaceId}/notifications/unread-count',
        {
          params: { path: { workspaceId }, header: { cookie } },
          cache: 'no-store',
        },
      ),
    ).count;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return null;
  }
}

/**
 * One page of what the person has been told about here, newest first. `null` when we could not
 * read it, which the panel says in a sentence: "nothing yet" and "we could not look" differ.
 */
async function pageIn(
  workspaceId: string,
  cookie: string | undefined,
  page: number,
): Promise<NotificationsPage | null> {
  try {
    const answer = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/notifications', {
        params: {
          path: { workspaceId },
          header: { cookie },
          query: { page, pageSize: NOTIFICATIONS_PAGE_SIZE },
        },
        cache: 'no-store',
      }),
    );
    const items = answer.items.map((item) => ({
      id: item.id,
      type: item.type,
      actorName: item.actor.name,
      actorPhotoUrl: item.actor.photoUrl,
      subjectId: item.subjectId,
      createdAt: item.createdAt,
      isRead: item.readAt !== null,
    }));
    return { items, total: answer.total };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return null;
  }
}

/**
 * The counts beside Waiting for me, Received's chips and Shared with me, read from the Asks,
 * Feedback and Kudos themselves: reading the bell leaves them as they were. `null` when we could
 * not find out, and the navigation keeps the numbers it already had.
 */
async function countsIn(
  workspaceId: string,
  cookie: string | undefined,
): Promise<PlaceCounts | null> {
  try {
    const counts = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/me/counts', {
        params: { path: { workspaceId }, header: { cookie } },
        cache: 'no-store',
      }),
    );
    return {
      waiting: counts.waitingAsks,
      requests: counts.newAnswers,
      offered: counts.newOffered,
      kudos: counts.newKudos,
      shared: counts.newShared,
    };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return null;
  }
}

const NOTHING_READ: BellRead = { count: null, page: null, counts: null };

/**
 * Everything one poll reads, in one server action: the bell's number, its newest page of lines,
 * and the counts in the navigation. Server actions are sent one at a time, so three actions would
 * be three round trips in a row, and every press made meanwhile — a mark, an answer — would wait
 * behind them. Here the Workspace is read once and the three reads run together.
 *
 * Each part is `null` on its own when the API refused it, so one failed read leaves the others to
 * paint.
 */
export async function readBell(): Promise<BellRead> {
  const workspaceId = await currentWorkspaceId();
  if (workspaceId === null) {
    return NOTHING_READ;
  }
  const cookie = await forwardedCookie();
  const [count, page, counts] = await Promise.all([
    unreadCountIn(workspaceId, cookie),
    pageIn(workspaceId, cookie, 1),
    countsIn(workspaceId, cookie),
  ]);
  return { count, page, counts };
}

/**
 * An older page of what the person has been told about here, as the bell asks for one when the
 * person scrolls near the end: page 1 is the most recent {@link NOTIFICATIONS_PAGE_SIZE}.
 */
export async function listMyNotifications(
  page = 1,
): Promise<NotificationsPage | null> {
  const pageNumber = PageNumber.safeParse(page);
  if (!pageNumber.success) {
    return null;
  }
  const workspaceId = await currentWorkspaceId();
  if (workspaceId === null) {
    return null;
  }
  return pageIn(workspaceId, await forwardedCookie(), pageNumber.data);
}

/**
 * Marks one thing read, which is what pressing its line does. The person is on their way to what
 * it pointed at, so a refusal is swallowed: the line comes back unread on the next poll, which
 * is a truer answer than an error over a screen they have already left.
 *
 * The API refuses an id that is not the caller's, so there is nothing here to check beyond the
 * id being an id at all.
 */
export async function markNotificationRead(id: string): Promise<void> {
  const notificationId = NotificationId.safeParse(id);
  if (!notificationId.success) {
    return;
  }
  const workspaceId = await currentWorkspaceId();
  if (workspaceId === null) {
    return;
  }
  const cookie = await forwardedCookie();
  try {
    // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/notifications/{id}/read',
      {
        params: {
          path: { workspaceId, id: notificationId.data },
          header: { cookie },
        },
      },
    );
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
  }
}

/**
 * Marks everything the person has been told about here as read. Answers whether it worked, so
 * the bell only clears a count that really is clear.
 */
export async function markAllNotificationsRead(): Promise<boolean> {
  const workspaceId = await currentWorkspaceId();
  if (workspaceId === null) {
    return false;
  }
  const cookie = await forwardedCookie();
  try {
    await apiClient().POST('/v1/workspaces/{workspaceId}/notifications/read', {
      params: { path: { workspaceId }, header: { cookie } },
    });
    return true;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return false;
  }
}

/**
 * The person opened a page with a count: its bell lines are read — what each one pointed at is on
 * screen — and, for a list that counts what is new, nothing in it is new any more. Waiting for me
 * reads its lines only: its count is the Asks still waiting, which only answering takes down.
 *
 * The two writes go together after one read of the Workspace, and each is swallowed on its own:
 * a count or a line that stays comes back right on the next poll, which is a truer answer than an
 * error over the list the person is reading.
 */
export async function markPlaceOpened(place: CountedPlace): Promise<void> {
  // Typed for the caller in this bundle, and checked anyway: a server action is a public endpoint.
  const opened = OpenedPlace.safeParse(place);
  if (!opened.success) {
    return;
  }
  const workspaceId = await currentWorkspaceId();
  if (workspaceId === null) {
    return;
  }
  const cookie = await forwardedCookie();
  const params = { path: { workspaceId }, header: { cookie } };
  // Answered 204 with no body, so there is nothing to unwrap; a refusal throws.
  const writes = [
    apiClient().POST('/v1/workspaces/{workspaceId}/notifications/read', {
      params,
      body: { types: typesReadIn(opened.data) },
    }),
  ];
  if (opened.data !== 'waiting') {
    writes.push(
      apiClient().POST('/v1/workspaces/{workspaceId}/me/seen', {
        params,
        body: { list: SEEN_LIST_ON_THE_WIRE[opened.data] },
      }),
    );
  }
  const results = await Promise.allSettled(writes);
  for (const result of results) {
    if (result.status === 'rejected' && !(result.reason instanceof ApiError)) {
      throw result.reason;
    }
  }
}
