import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { toPostcardWriter } from '@/app/(signed-in)/(brand-new)/_lib/postcard-writer.util';
import {
  toAskOnPostcard,
  toGivenPostcard,
} from '@/app/(signed-in)/(brand-new)/_lib/read-postcard.util';
import { NO_NAME_IN_A_SENTENCE } from '@/components/organisms/feed-card/feed-card-sentence.util';
import type {
  PostcardReadAnswer,
  ReadPostcard,
} from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** A postcard to read, and what the dialog shows it under. */
export type OpenedFeedbackPostcard = {
  readonly title: string;
  readonly card: ReadPostcard;
  /** Which answer the card pressed was, on a request's card. */
  readonly answerIndex: number;
};

/**
 * One piece as the postcard it was written on, or `null` when the caller may not read it, which
 * the API does not tell apart from one that does not exist. Not cached, as `readHomeFeed` is not.
 */
export async function readFeedbackPostcard(
  membership: CurrentMembership,
  feedbackId: string,
): Promise<OpenedFeedbackPostcard | null> {
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

    const { request } = feedback;
    if (!request) {
      const card = toGivenPostcard(feedback);
      if (!card) {
        return null;
      }
      return {
        title:
          feedback.giver.accountId === feedback.readerAccountId
            ? 'Your Feedback'
            : `Feedback from ${feedback.giver.name ?? NO_NAME_IN_A_SENTENCE}`,
        answerIndex: 0,
        card,
      };
    }

    const answers = request.answers.map(
      (answer): PostcardReadAnswer => ({
        giver: toPostcardWriter(answer.giver),
        message: answer.message,
        messageTags: answer.tags,
        stickers: answer.postcard?.stickers ?? [],
        textStyle: answer.postcard?.textStyle ?? DEFAULT_TEXT_STYLE,
        sentOn: answer.answeredAt,
      }),
    );
    const [first, ...rest] = answers;
    if (!first) {
      return null;
    }
    return {
      // Not the Giver's: the pager changes who is showing under a title that stays.
      title:
        request.requester.accountId === feedback.readerAccountId
          ? 'Feedback for you'
          : `Feedback for ${request.requester.name ?? NO_NAME_IN_A_SENTENCE}`,
      answerIndex: Math.max(
        request.answers.findIndex((answer) => answer.id === feedback.id),
        0,
      ),
      card: {
        kind: 'ask',
        ask: toAskOnPostcard(request),
        messageTags: request.tags,
        answers: [first, ...rest],
      },
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
