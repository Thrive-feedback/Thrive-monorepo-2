'use server';

import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import {
  readCurrentMembership,
  requireMember,
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
 */
async function currentWorkspaceId(): Promise<string> {
  const { membership } = await requireMember();
  return membership.workspace.id;
}

/**
 * The same, for the poll, which runs every minute per open tab and needs only the Workspace.
 * `requireMember` would also read the session — a second API call a minute for a fact this
 * throws away. `null` when there is no Workspace to count in, which the bell treats exactly as
 * it treats a failed poll: keep the number it had and say nothing.
 */
async function workspaceIdForPoll(): Promise<string | null> {
  return (await readCurrentMembership())?.workspace.id ?? null;
}

/**
 * How many things the person has been told about here and not yet read.
 *
 * `null` means we could not find out — the API refused, or could not be reached. The bell keeps
 * the number it already had rather than dropping to zero or putting an error on the screen: a
 * poll that failed is not worth telling anybody about, and the next one is a minute away.
 */
export async function countUnreadNotifications(): Promise<number | null> {
  const workspaceId = await workspaceIdForPoll();
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
