import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** One Feedback Request as its dialog on Home reads it. */
export type SentFeedbackRequest = {
  readonly id: string;
  readonly topic: string;
  readonly asks: readonly {
    readonly askId: string;
    /** The Member asked, or `null` while they have not introduced themselves. */
    readonly giverName: string | null;
    /** Deactivated in this Workspace, so shown as inactive; their Ask stays. */
    readonly giverInactive: boolean;
    readonly status: 'PENDING' | 'ANSWERED' | 'EXPIRED';
    /** What they wrote, once they have — and only for the people allowed to read it. */
    readonly answer: string | null;
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
      topic: request.topic,
      asks: request.asks.map((ask) => ({
        askId: ask.askId,
        giverName: ask.giverName,
        giverInactive: ask.giverStatus === 'DEACTIVATED',
        status: ask.status,
        answer: ask.answer?.body ?? null,
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
