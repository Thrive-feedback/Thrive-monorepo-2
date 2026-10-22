import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { GivenFeedback } from '@/lib/feedback/given-feedback.type';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** As on the other tabs: one page covers a Workspace of 20–50 people. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * The Feedback the signed-in person wrote, newest first. Whose it is is the API's to decide
 * from the session — it is not a parameter here, and cannot be.
 *
 * Not cached across requests — `cache` only shares one call between the two layouts Home
 * draws: a new piece is listed the moment they give it, and one person's history must never be
 * served to another.
 */
export const readGivenFeedback = cache(
  async (membership: CurrentMembership): Promise<GivenFeedback[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const given = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/given-feedback', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: ONE_PAGE,
        },
        cache: 'no-store',
      }),
    );
    return given.items.map((feedback) => ({
      id: feedback.id,
      topic: feedback.topic,
      topicTags: feedback.topicTags,
      offered: feedback.origin === 'OFFERED',
      receiverName: feedback.receiver.name,
      receiverInactive: feedback.receiver.status === 'DEACTIVATED',
      body: feedback.body,
      bodyTags: feedback.tags,
      writtenAt: feedback.createdAt,
    }));
  },
);
