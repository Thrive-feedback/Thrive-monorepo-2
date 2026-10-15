'use server';

import { ApiError, type components, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import type { RequestFeedbackState } from './request-feedback-state.type';

type Visibility =
  components['schemas']['SendFeedbackRequestRequestDto']['visibility'];

/** Every Visibility the contract accepts; `satisfies` fails the build if the two drift apart. */
const VISIBILITIES = [
  'ONLY_ME',
  'SELECTED_PEOPLE',
  'EVERYONE',
] as const satisfies readonly Visibility[];

/** The shape the API's own schema accepts, so the browser is never the first to check it. */
const RequestFeedbackInput = z
  .object({
    giverAccountId: z.uuid(),
    topic: z.string().trim().min(1),
    visibility: z.enum(VISIBILITIES),
    selectedAccountIds: z.array(z.uuid()),
  })
  .refine(
    (input) =>
      input.visibility !== 'SELECTED_PEOPLE' ||
      input.selectedAccountIds.length > 0,
    { path: ['selectedAccountIds'] },
  );

/** What to say when the API refused the send, by its error code. */
const SEND_ERRORS: Readonly<Record<string, string>> = {
  GIVER_NOT_IN_WORKSPACE: 'That teammate is no longer in your Workspace.',
  CANNOT_ASK_YOURSELF: "You can't ask yourself for Feedback.",
  GIVER_ALREADY_ASKED: 'You have already asked this teammate about this.',
  TOPIC_TOO_LONG: 'That Topic is too long. Try saying it more briefly.',
  NO_PEOPLE_SELECTED: 'Pick at least one person to share it with.',
  SELECTED_PERSON_NOT_IN_WORKSPACE:
    'Someone you picked to share it with is no longer in your Workspace.',
};

/** Where to go instead when the API says this step is not the person's to take. */
const ELSEWHERE: Readonly<Record<string, string>> = {
  NOT_SIGNED_IN: ROUTES.signIn,
  // Left the Workspace from another tab: there is nobody here to ask.
  WORKSPACE_NOT_FOUND: ROUTES.home,
};

const COULD_NOT_SEND = "We couldn't send your request. Please try again.";

/**
 * Asks one teammate for Feedback on a Topic, shared with whoever the Requester chose, then goes
 * back to Home's My requests tab. The Workspace is the one the session belongs to, never one the
 * browser names, and the API decides who is asking from the session cookie.
 *
 * Treated as a public endpoint, because it is one: the session is read again here and the
 * input is validated again, whatever the form already checked.
 */
export async function requestFeedback(
  _previous: RequestFeedbackState,
  formData: FormData,
): Promise<RequestFeedbackState> {
  const input = RequestFeedbackInput.safeParse({
    giverAccountId: formData.get('giverAccountId'),
    topic: formData.get('topic'),
    visibility: formData.get('visibility'),
    selectedAccountIds: formData.getAll('selectedAccountIds'),
  });
  if (!input.success) {
    const { fieldErrors } = z.flattenError(input.error);
    return {
      fieldErrors: {
        giverAccountId: fieldErrors.giverAccountId
          ? 'Pick who to ask.'
          : undefined,
        topic: fieldErrors.topic ? 'Add a Topic.' : undefined,
        selectedAccountIds: fieldErrors.selectedAccountIds
          ? 'Pick at least one person to share it with.'
          : undefined,
      },
    };
  }

  const { membership } = await requireMember();
  const cookie = (await headers()).get('cookie') ?? undefined;
  let next: string;
  try {
    unwrap(
      await apiClient().POST('/v1/workspaces/{workspaceId}/feedback-requests', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
        },
        body: {
          topic: input.data.topic,
          giverAccountIds: [input.data.giverAccountId],
          visibility: input.data.visibility,
          // Sent only with Selected people: the API refuses people picked for anything else.
          ...(input.data.visibility === 'SELECTED_PEOPLE' && {
            selectedAccountIds: input.data.selectedAccountIds,
          }),
        },
      }),
    );
    // Back to Home, on the tab that now lists it, saying once that it went.
    next = `${ROUTES.homeTab('my-requests')}&sent=1`;
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
