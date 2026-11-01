import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { toFeedItem } from './feed-item.util';

/**
 * One piece of Feedback, or `null` when this Workspace has none with that id the caller may
 * read — which is also the answer for Feedback whose Visibility shuts them out, because the API
 * refuses to tell the two apart.
 *
 * Not cached: Visibility can change after it was written, and one person's Feedback must never
 * be served to another.
 */
export async function readFeedback(
  membership: CurrentMembership,
  feedbackId: string,
): Promise<FeedItem | null> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    const feedback = unwrap(
      await apiClient().GET(
        '/v1/workspaces/{workspaceId}/feedback/{feedbackId}',
        {
          params: {
            path: { workspaceId: membership.workspace.id, feedbackId },
            header: { cookie },
          },
          cache: 'no-store',
        },
      ),
    );
    return toFeedItem(feedback);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.code === 'FEEDBACK_NOT_FOUND' ||
        error.code === 'WORKSPACE_NOT_FOUND')
    ) {
      return null;
    }
    throw error;
  }
}
