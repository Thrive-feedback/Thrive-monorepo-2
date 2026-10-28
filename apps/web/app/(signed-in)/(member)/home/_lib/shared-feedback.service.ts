import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { toFeedItem } from '@/lib/feedback/feed-item.util';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { readViewerAccountId } from '@/lib/session/session.service';

/** As on the other tabs: one page covers a Workspace of 20–50 people. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * The Feedback somebody chose to show the signed-in person, newest first. Who they are is the
 * API's to decide from the session — it is not a parameter here, and cannot be.
 *
 * Not cached across requests — `cache` only shares one call between the two layouts Home draws:
 * what one person was shown must never be served to another.
 */
export const readSharedFeedback = cache(
  async (membership: CurrentMembership): Promise<FeedItem[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const viewerAccountId = await readViewerAccountId();
    const shared = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/shared-feedback', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: ONE_PAGE,
        },
        cache: 'no-store',
      }),
    );
    return shared.items.map((feedback) =>
      toFeedItem(feedback, viewerAccountId),
    );
  },
);
