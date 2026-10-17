import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { WaitingAsk } from '@/lib/feedback/waiting-ask.type';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/**
 * The Ask, or `null` when none with that id is waiting for this person — which is also the
 * answer for an Ask addressed to somebody else, because the API refuses to tell them apart.
 *
 * Not cached: it stops being answerable the moment they answer it, and one Member's Ask must
 * never be served to another.
 */
export async function readFeedbackAsk(
  membership: CurrentMembership,
  askId: string,
): Promise<WaitingAsk | null> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    const ask = unwrap(
      await apiClient().GET(
        '/v1/workspaces/{workspaceId}/feedback-asks/{askId}',
        {
          params: {
            path: { workspaceId: membership.workspace.id, askId },
            header: { cookie },
          },
          cache: 'no-store',
        },
      ),
    );
    return {
      askId: ask.askId,
      feedbackRequestId: ask.feedbackRequestId,
      topic: ask.topic,
      requesterName: ask.requester.name,
      requesterInactive: ask.requester.status === 'DEACTIVATED',
      status: ask.status,
    };
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.code === 'FEEDBACK_ASK_NOT_FOUND' ||
        error.code === 'WORKSPACE_NOT_FOUND')
    ) {
      return null;
    }
    throw error;
  }
}
