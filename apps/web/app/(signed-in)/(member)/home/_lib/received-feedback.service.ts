import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { ReceivedFeedback } from '@/lib/feedback/received-feedback.type';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** As on My requests: one page covers a Workspace of 20–50 people asking one another. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * The Feedback written to the signed-in person, newest first. Whose it is is the API's to
 * decide from the session — it is not a parameter here, and cannot be.
 *
 * Not cached across requests — `cache` only shares one call between the two layouts Home
 * draws: a new piece arrives the moment somebody answers, and one person's Feedback must never
 * be served to another.
 */
export const readReceivedFeedback = cache(
  async (membership: CurrentMembership): Promise<ReceivedFeedback[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const received = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/feedback', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: ONE_PAGE,
        },
        cache: 'no-store',
      }),
    );
    return received.items.map((feedback) => ({
      id: feedback.id,
      topic: feedback.topic,
      offered: feedback.origin === 'OFFERED',
      giverName: feedback.giverName,
      body: feedback.body,
      writtenAt: feedback.createdAt,
    }));
  },
);
