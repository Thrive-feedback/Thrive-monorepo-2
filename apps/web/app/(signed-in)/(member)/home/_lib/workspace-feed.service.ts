import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { toFeedbackPerson } from '@/lib/feedback/feedback-person.util';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** As on the other tabs: one page covers a Workspace of 20–50 people. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * The Feedback this Workspace shared with everybody in it, newest first.
 *
 * Home draws the narrow and the wide layout and lets CSS show one, so this is rendered twice
 * per request; `cache` makes that one call. It is not cached across requests — the feed changes
 * the moment somebody shares, and a Workspace's Feedback is only its own Members'.
 */
export const readWorkspaceFeed = cache(
  async (membership: CurrentMembership): Promise<FeedItem[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const feed = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/feed', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: ONE_PAGE,
        },
        cache: 'no-store',
      }),
    );
    return feed.items.map((feedback) => ({
      id: feedback.id,
      giverName: feedback.giver.name,
      giverPhotoUrl: feedback.giver.photoUrl,
      giverInactive: feedback.giver.status === 'DEACTIVATED',
      receivers: feedback.receivers.map(toFeedbackPerson),
      origin: feedback.origin,
      message: feedback.message,
      messageTags: feedback.tags,
      givenAt: feedback.createdAt,
      // Reactions are #92; until then a card shows the four with nobody behind them.
      reactions: {},
      request: feedback.request && {
        message: feedback.request.message,
        messageTags: feedback.request.tags,
        requester: toFeedbackPerson(feedback.request.requester),
        asked: feedback.request.asked.map(toFeedbackPerson),
      },
    }));
  },
);
