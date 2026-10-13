import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { SentRequest } from './sent-request.type';

/**
 * One page of the largest size the API allows. A Workspace holds 20–50 people and one request
 * is sent at a time, so this covers every request a person has sent for now; paging the screen
 * waits until somebody has more than a hundred.
 */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * The Feedback Requests the signed-in person sent, newest first. Whose they are is the API's
 * to decide from the session — it is not a parameter here, and cannot be.
 *
 * Not cached: an Ask's status changes the moment its Giver answers, and one person's requests
 * must never be served to another.
 */
export async function readSentRequests(
  membership: CurrentMembership,
): Promise<SentRequest[]> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const sent = unwrap(
    await apiClient().GET('/v1/workspaces/{workspaceId}/feedback-requests', {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie },
        query: ONE_PAGE,
      },
      cache: 'no-store',
    }),
  );
  return sent.items.map((request) => ({
    id: request.id,
    topic: request.topic,
    sentAt: request.createdAt,
    asks: request.asks.map((ask) => ({
      askId: ask.askId,
      giverName: ask.giverName,
      status: ask.status,
    })),
  }));
}
