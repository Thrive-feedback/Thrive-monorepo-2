import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { PLAIN_POSTCARD } from '@/app/(signed-in)/(brand-new)/_lib/plain-postcard.constant';
import { toPostcardWriter } from '@/app/(signed-in)/(brand-new)/_lib/postcard-writer.util';
import type { PostcardAsk } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/**
 * The Ask as the card it is answered on, or `null` when there is nothing left to answer: it was
 * answered already, or it is not this person's, which the API does not tell apart from one that
 * does not exist. Not cached, because it stops being answerable the moment it is answered.
 */
export async function readWaitingPostcard(
  membership: CurrentMembership,
  askId: string,
): Promise<PostcardAsk | null> {
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
    if (ask.status !== 'PENDING') {
      return null;
    }
    return {
      ...PLAIN_POSTCARD,
      ...ask.postcard,
      requester: toPostcardWriter(ask.requester),
      message: ask.message,
      messageTags: ask.tags,
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
