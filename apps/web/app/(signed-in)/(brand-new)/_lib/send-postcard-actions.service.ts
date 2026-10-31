'use server';

import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client.service';
import {
  ANSWER_ASK_ERRORS,
  GIVE_FEEDBACK_ERRORS,
  REQUEST_FEEDBACK_ERRORS,
} from '@/lib/feedback/send-feedback-errors.constant';
import { ROUTES } from '@/lib/routes.constant';
import { requireMemberOf } from '@/lib/session/session.service';
import { SentAnswerInput, SentPostcardInput } from './sent-postcard.schema';
import type {
  SendPostcardResult,
  SentAnswer,
  SentPostcard,
} from './sent-postcard.type';

const COULD_NOT_SEND_FEEDBACK =
  "We couldn't send your feedback. Please try again.";
const COULD_NOT_SEND_REQUEST =
  "We couldn't send your request. Please try again.";
const COULD_NOT_SEND_ANSWER = "We couldn't send your answer. Please try again.";

/**
 * Sends one card and answers with what to say if it did not go. Anything but a refusal the API
 * has words for leaves the writer on their card with the fallback, since nothing was stored.
 * Being signed out or no longer in the Workspace leaves the page altogether: there is nobody
 * here to send it as.
 */
async function send(
  post: () => Promise<unknown>,
  refusals: Readonly<Record<string, string>>,
  couldNotSend: string,
): Promise<SendPostcardResult> {
  let elsewhere: string;
  try {
    await post();
    return {};
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (error.code === 'NOT_SIGNED_IN') {
      elsewhere = ROUTES.signIn;
    } else if (error.code === 'WORKSPACE_NOT_FOUND') {
      elsewhere = ROUTES.brandNewHome;
    } else {
      return { formError: refusals[error.code] ?? couldNotSend };
    }
  }
  // Outside the `try`: `redirect` works by throwing, and the catch above would swallow it.
  redirect(elsewhere);
}

/**
 * Gives one or more teammates the Feedback on this card, with the card itself. `workspaceId` is
 * the Workspace the page was drawn for; it must still be the one the person is in, or nothing is
 * sent. The API decides who is giving it from the session cookie.
 *
 * Treated as a public endpoint, because it is one: the session is read again here and the input
 * is validated again, whatever the card already checked.
 */
export async function sendPostcardFeedback(
  workspaceId: string,
  postcard: SentPostcard,
): Promise<SendPostcardResult> {
  const input = SentPostcardInput.safeParse(postcard);
  if (!input.success) {
    return { formError: COULD_NOT_SEND_FEEDBACK };
  }

  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  return send(
    async () =>
      unwrap(
        await apiClient().POST('/v1/workspaces/{workspaceId}/feedback', {
          params: {
            path: { workspaceId: membership.workspace.id },
            header: { cookie },
          },
          body: {
            receiverAccountIds: input.data.recipientAccountIds,
            message: input.data.message,
            visibility: input.data.visibility,
            // Only Selected people names anybody; the API refuses a list under any other choice.
            selectedAccountIds:
              input.data.visibility === 'SELECTED_PEOPLE'
                ? input.data.selectedAccountIds
                : [],
            postcard: input.data.look,
          },
        }),
      ),
    GIVE_FEEDBACK_ERRORS,
    COULD_NOT_SEND_FEEDBACK,
  );
}

/**
 * Asks one or more teammates for Feedback on this card, with the card itself, on the same terms
 * as `sendPostcardFeedback`.
 */
export async function sendPostcardRequest(
  workspaceId: string,
  postcard: SentPostcard,
): Promise<SendPostcardResult> {
  const input = SentPostcardInput.safeParse(postcard);
  if (!input.success) {
    return { formError: COULD_NOT_SEND_REQUEST };
  }

  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  return send(
    async () =>
      unwrap(
        await apiClient().POST(
          '/v1/workspaces/{workspaceId}/feedback-requests',
          {
            params: {
              path: { workspaceId: membership.workspace.id },
              header: { cookie },
            },
            body: {
              giverAccountIds: input.data.recipientAccountIds,
              message: input.data.message,
              visibility: input.data.visibility,
              // Sent only with Selected people: the API refuses people picked for anything else.
              ...(input.data.visibility === 'SELECTED_PEOPLE' && {
                selectedAccountIds: input.data.selectedAccountIds,
              }),
              postcard: input.data.look,
            },
          },
        ),
      ),
    REQUEST_FEEDBACK_ERRORS,
    COULD_NOT_SEND_REQUEST,
  );
}

/**
 * Answers one Ask on its postcard, on the same terms as `sendPostcardFeedback`. It does not
 * revalidate the page: that would read the Ask again while the card is still flying off, and find
 * it answered. The dialog refreshes once the card has gone.
 */
export async function sendPostcardAnswer(
  workspaceId: string,
  askId: string,
  answer: SentAnswer,
): Promise<SendPostcardResult> {
  const input = SentAnswerInput.safeParse({ askId, ...answer });
  if (!input.success) {
    return { formError: COULD_NOT_SEND_ANSWER };
  }

  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  return send(
    async () =>
      unwrap(
        await apiClient().POST(
          '/v1/workspaces/{workspaceId}/feedback-asks/{askId}/answers',
          {
            params: {
              path: {
                workspaceId: membership.workspace.id,
                askId: input.data.askId,
              },
              header: { cookie },
            },
            body: { message: input.data.message, postcard: input.data.look },
          },
        ),
      ),
    ANSWER_ASK_ERRORS,
    COULD_NOT_SEND_ANSWER,
  );
}
