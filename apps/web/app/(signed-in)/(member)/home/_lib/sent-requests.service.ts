import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { SentRequest } from '@/lib/feedback/sent-request.type';
import type { CurrentMembership } from '@/lib/session/current-account.type';

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
 * Not cached across requests — `cache` only shares one call between the two layouts
 * Home draws: an Ask's status changes the moment its Giver answers, and one person's requests
 * must never be served to another.
 */
export const readSentRequests = cache(
  async (membership: CurrentMembership): Promise<SentRequest[]> => {
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
  },
);
