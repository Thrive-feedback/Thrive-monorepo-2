import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { MyAsk } from './my-ask.type';

/** As on My requests: one page covers a Workspace of 20–50 people asking one another. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * The Asks waiting for the signed-in person, newest first. `PENDING` is the API's default and
 * is passed anyway, so the screen says which list it is showing rather than inheriting it.
 *
 * Not cached across requests — `cache` only shares one call between the two layouts
 * Home draws: an Ask leaves this list the moment the person answers it, and one person's Asks
 * must never be served to another.
 */
export const readMyAsks = cache(
  async (membership: CurrentMembership): Promise<MyAsk[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const waiting = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/feedback-asks', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: { ...ONE_PAGE, status: 'PENDING' },
        },
        cache: 'no-store',
      }),
    );
    return waiting.items.map((ask) => ({
      askId: ask.askId,
      topic: ask.topic,
      requesterName: ask.requester.name,
      askedAt: ask.createdAt,
      status: ask.status,
    }));
  },
);
