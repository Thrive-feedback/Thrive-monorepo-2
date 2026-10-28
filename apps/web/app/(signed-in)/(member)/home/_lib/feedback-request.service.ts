import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { TextTags } from '@/lib/feedback/text-tags.type';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** One Feedback Request as its dialog on Home reads it. */
export type SentFeedbackRequest = {
  readonly id: string;
  /** The Request message. */
  readonly message: string;
  /** What the Request message was bound to when the request was sent. */
  readonly messageTags: TextTags;
  readonly asks: readonly {
    readonly askId: string;
    /** The Member asked, or `null` while they have not introduced themselves. */
    readonly giverName: string | null;
    /** Their Google photo, or `null` when they have none. */
    readonly giverPhotoUrl: string | null;
    /** Deactivated in this Workspace, so shown as inactive; their Ask stays. */
    readonly giverInactive: boolean;
    readonly status: 'PENDING' | 'ANSWERED' | 'EXPIRED';
    /** What they wrote, once they have — and only for the people allowed to read it. */
    readonly answer: {
      readonly message: string;
      /** What the answer was bound to: only what its Giver wrote. */
      readonly tags: TextTags;
    } | null;
  }[];
  /**
   * Who besides the Requester reads the answers, with the people selected — `null` for a Giver,
   * whom the API does not tell.
   */
  readonly visibility: {
    readonly value: 'ONLY_ME' | 'SELECTED_PEOPLE' | 'EVERYONE';
    readonly selectedPeople: readonly {
      /** `null` for a Member who has not introduced themselves. */
      readonly name: string | null;
      /** Deactivated in this Workspace, so shown as inactive. */
      readonly inactive: boolean;
    }[];
  } | null;
};

/**
 * The request, or `null` when this Workspace has none with that id — which is also the answer
 * for another Workspace's request, because the API refuses to tell the two apart.
 *
 * Not cached: an Ask's status changes when its Giver answers, and one Workspace's request
 * must never be served to another.
 */
export async function readFeedbackRequest(
  membership: CurrentMembership,
  requestId: string,
): Promise<SentFeedbackRequest | null> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    const request = unwrap(
      await apiClient().GET(
        '/v1/workspaces/{workspaceId}/feedback-requests/{requestId}',
        {
          params: {
            path: { workspaceId: membership.workspace.id, requestId },
            header: { cookie },
          },
          cache: 'no-store',
        },
      ),
    );
    return {
      id: request.id,
      message: request.message,
      messageTags: request.tags,
      asks: request.asks.map((ask) => ({
        askId: ask.askId,
        giverName: ask.giverName,
        giverPhotoUrl: ask.giverPhotoUrl,
        giverInactive: ask.giverStatus === 'DEACTIVATED',
        status: ask.status,
        answer: ask.answer && {
          message: ask.answer.message,
          tags: ask.answer.tags,
        },
      })),
      visibility: request.visibility && {
        value: request.visibility.value,
        selectedPeople: request.visibility.selectedPeople.map((person) => ({
          name: person.name,
          inactive: person.status === 'DEACTIVATED',
        })),
      },
    };
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.code === 'FEEDBACK_REQUEST_NOT_FOUND' ||
        error.code === 'WORKSPACE_NOT_FOUND')
    ) {
      return null;
    }
    throw error;
  }
}
