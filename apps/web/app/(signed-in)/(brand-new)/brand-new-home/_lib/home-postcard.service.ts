import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import {
  NO_NAME_IN_A_SENTENCE,
  NO_NAME_STARTING_A_SENTENCE,
} from '@/components/organisms/feed-card/feed-card-sentence.util';
import type {
  PostcardReadAnswer,
  ReadPostcard,
} from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { POSTCARD_TEMPLATES } from '@/components/organisms/postcard-dialog/postcard-template.constant';
import { apiClient } from '@/lib/api-client.service';
import { toFeedbackPerson } from '@/lib/feedback/feedback-person.util';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** How a card looks when what it holds was not written on a postcard. */
const PLAIN_POSTCARD = {
  templateKey: POSTCARD_TEMPLATES[0].key,
  tone: 'cream',
  textStyle: DEFAULT_TEXT_STYLE,
  stickers: [],
  stampKey: null,
} as const;

type PersonOnTheWire = Parameters<typeof toFeedbackPerson>[0];

function toWriter(person: PersonOnTheWire) {
  const { name, photoUrl, inactive } = toFeedbackPerson(person);
  return { name: name ?? NO_NAME_STARTING_A_SENTENCE, photoUrl, inactive };
}

/** A postcard to read on Home, and what the dialog shows it under. */
export type HomePostcard = {
  readonly title: string;
  readonly card: ReadPostcard;
  /** Which answer the card pressed was, on a request's card. */
  readonly answerIndex: number;
};

/**
 * One piece as the postcard it was written on, or `null` when the caller may not read it, which
 * the API does not tell apart from one that does not exist. Not cached, as `readHomeFeed` is not.
 */
export async function readHomePostcard(
  membership: CurrentMembership,
  feedbackId: string,
): Promise<HomePostcard | null> {
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
      const [receiver, ...others] = feedback.receivers;
      if (!receiver) {
        return null;
      }
      const giver = toWriter(feedback.giver);
      return {
        title:
          feedback.giver.accountId === feedback.readerAccountId
            ? 'Your Feedback'
            : `Feedback from ${feedback.giver.name ?? NO_NAME_IN_A_SENTENCE}`,
        answerIndex: 0,
        card: {
          ...PLAIN_POSTCARD,
          ...feedback.postcard,
          kind: 'give',
          giver,
          receivers: [
            toFeedbackPerson(receiver),
            ...others.map(toFeedbackPerson),
          ],
          message: feedback.message,
          messageTags: feedback.tags,
          sentOn: feedback.createdAt,
        },
      };
    }

    const answers = request.answers.map(
      (answer): PostcardReadAnswer => ({
        giver: toWriter(answer.giver),
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
    const requester = toWriter(request.requester);
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
        ask: {
          ...PLAIN_POSTCARD,
          ...request.postcard,
          requester,
          message: request.message,
        },
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
