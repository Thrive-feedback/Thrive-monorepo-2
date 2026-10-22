'use server';

import { ApiError, type components, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import type { GiveFeedbackState } from '@/lib/feedback/give-feedback-state.type';
import { ROUTES } from '@/lib/routes.constant';
import { requireMemberOf } from '@/lib/session/session.service';

type Visibility =
  components['schemas']['OfferFeedbackRequestDto']['visibility'];

/** Every Visibility the contract accepts; `satisfies` fails the build if the two drift apart. */
const VISIBILITIES = [
  'ONLY_ME',
  'SELECTED_PEOPLE',
  'EVERYONE',
] as const satisfies readonly Visibility[];

/** As long as the API lets a Feedback message be. */
const MAX_MESSAGE_LENGTH = 4000;

const TOO_LONG = `Your feedback is too long. Keep it under ${MAX_MESSAGE_LENGTH} characters.`;

/** The shape the API's own schema accepts, so the browser is never the first to check it. */
const GiveFeedbackInput = z
  .object({
    receiverAccountId: z.uuid(),
    message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
    visibility: z.enum(VISIBILITIES),
    selectedAccountIds: z.array(z.uuid()),
  })
  .refine(
    (input) =>
      input.visibility !== 'SELECTED_PEOPLE' ||
      input.selectedAccountIds.length > 0,
    { path: ['selectedAccountIds'] },
  );

/** What to say when the API refused it, by its error code. */
const SEND_ERRORS: Readonly<Record<string, string>> = {
  RECEIVER_NOT_IN_WORKSPACE: 'That teammate is no longer in your Workspace.',
  CANNOT_GIVE_YOURSELF_FEEDBACK: "You can't give yourself Feedback.",
  NO_PEOPLE_SELECTED: 'Pick at least one person to share it with.',
  SELECTED_PERSON_NOT_IN_WORKSPACE:
    'Someone you picked to share it with is no longer in your Workspace.',
  FEEDBACK_MESSAGE_TOO_LONG: TOO_LONG,
};

/** Where to go instead when the API says this step is not the person's to take. */
const ELSEWHERE: Readonly<Record<string, string>> = {
  NOT_SIGNED_IN: ROUTES.signIn,
  // Left the Workspace from another tab: there is nobody here to give it to.
  WORKSPACE_NOT_FOUND: ROUTES.home,
};

const COULD_NOT_SEND = "We couldn't send your feedback. Please try again.";

/**
 * Gives one teammate Feedback without being asked, then goes back to Home, saying once that it
 * went. `workspaceId` is the Workspace the page was drawn for, bound where the form is drawn; it
 * must still be the one the person is in, or nothing is sent. The API decides who is giving it
 * from the session cookie.
 *
 * Treated as a public endpoint, because it is one: the session is read again here and the
 * input is validated again, whatever the form already checked.
 */
export async function giveFeedback(
  workspaceId: string,
  _previous: GiveFeedbackState,
  formData: FormData,
): Promise<GiveFeedbackState> {
  const input = GiveFeedbackInput.safeParse({
    receiverAccountId: formData.get('receiverAccountId'),
    message: formData.get('message'),
    visibility: formData.get('visibility'),
    selectedAccountIds: formData.getAll('selectedAccountIds'),
  });
  if (!input.success) {
    const { fieldErrors } = z.flattenError(input.error);
    const messageTooLong = input.error.issues.some(
      (issue) => issue.path[0] === 'message' && issue.code === 'too_big',
    );
    return {
      fieldErrors: {
        receiverAccountId: fieldErrors.receiverAccountId
          ? 'Pick who it is for.'
          : undefined,
        message: messageTooLong
          ? TOO_LONG
          : fieldErrors.message
            ? 'Write your feedback.'
            : undefined,
        selectedAccountIds: fieldErrors.selectedAccountIds
          ? 'Pick at least one person to share it with.'
          : undefined,
      },
    };
  }

  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  let next: string;
  try {
    unwrap(
      await apiClient().POST('/v1/workspaces/{workspaceId}/feedback', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
        },
        body: {
          receiverAccountId: input.data.receiverAccountId,
          message: input.data.message,
          visibility: input.data.visibility,
          // Only Selected people names anybody; the API refuses a list under any other choice.
          selectedAccountIds:
            input.data.visibility === 'SELECTED_PEOPLE'
              ? input.data.selectedAccountIds
              : [],
        },
      }),
    );
    next = ROUTES.homeGiven;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    const sendError = SEND_ERRORS[error.code];
    if (sendError) {
      return { formError: sendError };
    }
    const elsewhere = ELSEWHERE[error.code];
    if (!elsewhere) {
      return { formError: COULD_NOT_SEND };
    }
    next = elsewhere;
  }
  // Outside the `try`: `redirect` works by throwing, and the catch above would swallow it.
  redirect(next);
}
