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
import type { BellNotification } from './notification.type';

/**
 * The panel holds the most recent, not a history: there is no way to scroll further, so one
 * short page is the whole of it.
 */
const PANEL_PAGE = { page: 1, pageSize: 10 };

const NotificationId = z.uuid();

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
 * How many things the person has been told about here and not yet read.
 *
 * `null` means we could not find out — the API refused, or could not be reached. The bell keeps
 * the number it already had rather than dropping to zero or putting an error on the screen: a
 * poll that failed is not worth telling anybody about, and the next one is a minute away.
 */
export async function countUnreadNotifications(): Promise<number | null> {
  const workspaceId = await currentWorkspaceId();
  if (workspaceId === null) {
    return null;
  }
  const cookie = await forwardedCookie();
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
 * The most recent things the person has been told about here, newest first.
 *
 * `null` means we could not read them, which the panel says in a sentence rather than showing
 * an empty list — "nothing yet" and "we could not look" are different answers.
 */
export async function listMyNotifications(): Promise<
  readonly BellNotification[] | null
> {
  const workspaceId = await currentWorkspaceId();
  if (workspaceId === null) {
    return null;
  }
  const cookie = await forwardedCookie();
  try {
    const page = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/notifications', {
        params: {
          path: { workspaceId },
          header: { cookie },
          query: PANEL_PAGE,
        },
        cache: 'no-store',
      }),
    );
    return page.items.map((item) => ({
      id: item.id,
      type: item.type,
      actorName: item.actor.name,
      subjectId: item.subjectId,
      createdAt: item.createdAt,
      isRead: item.readAt !== null,
    }));
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return null;
  }
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
