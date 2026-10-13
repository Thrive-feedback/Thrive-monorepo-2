'use server';

import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import type { AnswerAskState } from './answer-ask-state.type';

/** What the API's own schema accepts, so the browser is never the first to check it. */
const MAX_ANSWER_LENGTH = 4000;
const AnswerAskInput = z.object({
  askId: z.uuid(),
  body: z.string().trim().min(1).max(MAX_ANSWER_LENGTH),
});

const WRITE_SOMETHING = 'Write your answer before sending it.';
const TOO_LONG = `That answer is longer than ${MAX_ANSWER_LENGTH.toLocaleString('en-GB')} characters. Try saying it more briefly.`;
const COULD_NOT_SEND = "We couldn't send your answer. Please try again.";

/** What to say when the API refused the answer, by its error code. */
const ANSWER_ERRORS: Readonly<Record<string, string>> = {
  FEEDBACK_BODY_EMPTY: WRITE_SOMETHING,
  FEEDBACK_BODY_TOO_LONG: TOO_LONG,
};

/** Where to go instead when the API says this step is not the person's to take. */
const ELSEWHERE: Readonly<Record<string, string>> = {
  NOT_SIGNED_IN: ROUTES.signIn,
  // Left the Workspace from another tab: the Ask went with it.
  WORKSPACE_NOT_FOUND: ROUTES.home,
};

/**
 * Answers one Ask. Who is answering comes from the session, never from the form, so the only
 * thing the browser decides is what was written.
 *
 * Treated as a public endpoint, because it is one: the session is read again here and the
 * answer is validated again, whatever the form already checked.
 *
 * On success it goes back to the same Ask, which then shows what was written instead of the
 * box — a confirmation that survives a refresh, as the request's own confirmation does. An Ask
 * that was already answered lands in the same place, where the page says so.
 */
export async function answerAsk(
  _previous: AnswerAskState,
  formData: FormData,
): Promise<AnswerAskState> {
  const input = AnswerAskInput.safeParse({
    askId: formData.get('askId'),
    body: formData.get('body'),
  });
  if (!input.success) {
    const { fieldErrors } = z.flattenError(input.error);
    const tooLong = (formData.get('body') as string | null) ?? '';
    return {
      fieldErrors: {
        body: fieldErrors.body
          ? tooLong.trim().length > MAX_ANSWER_LENGTH
            ? TOO_LONG
            : WRITE_SOMETHING
          : undefined,
      },
      // A malformed id never comes from the form this page renders.
      formError: fieldErrors.askId ? COULD_NOT_SEND : undefined,
    };
  }

  const { membership } = await requireMember();
  const cookie = (await headers()).get('cookie') ?? undefined;
  let next: string;
  try {
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
          body: { body: input.data.body },
        },
      ),
    );
    next = ROUTES.feedback.askById(input.data.askId);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (error.code === 'FEEDBACK_ASK_NOT_FOUND') {
      notFound();
    }
    const answerError = ANSWER_ERRORS[error.code];
    if (answerError) {
      return { fieldErrors: { body: answerError } };
    }
    if (error.code === 'ASK_ALREADY_ANSWERED') {
      // Sent twice: the Ask holds the first answer, and the page it goes back to says so.
      next = ROUTES.feedback.askById(input.data.askId);
    } else {
      const elsewhere = ELSEWHERE[error.code];
      if (!elsewhere) {
        return { formError: COULD_NOT_SEND };
      }
      next = elsewhere;
    }
  }
  // Outside the `try`: `redirect` works by throwing, and the catch above would swallow it.
  redirect(next);
}
