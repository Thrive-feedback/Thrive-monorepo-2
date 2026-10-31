'use server';

import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import type { GiveKudosState } from '@/lib/feedback/give-kudos-state.type';
import { kudosLength, MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';
import { ROUTES } from '@/lib/routes.constant';
import { requireMemberOf } from '@/lib/session/session.service';

const TOO_LONG = `Your Kudos is too long. Keep it to ${MAX_KUDOS_LENGTH} characters.`;

/** The shape the API's own schema accepts, so the browser is never the first to check it. */
const GiveKudosInput = z.object({
  message: z.string().refine((message) => kudosLength(message) > 0, {
    message: 'empty',
  }),
});

/** What to say when the API refused it, by its error code. */
const SEND_ERRORS: Readonly<Record<string, string>> = {
  KUDOS_MESSAGE_EMPTY: 'Write your Kudos.',
  KUDOS_MESSAGE_TOO_LONG: TOO_LONG,
};

/** Where to go instead when the API says this step is not the person's to take. */
const ELSEWHERE: Readonly<Record<string, string>> = {
  NOT_SIGNED_IN: ROUTES.signIn,
  // Left the Workspace from another tab: there is nobody here to give it to.
  WORKSPACE_NOT_FOUND: ROUTES.home,
};

const COULD_NOT_SEND = "We couldn't send your Kudos. Please try again.";

/**
 * Gives Kudos to the teammates the message @mentions, or to the whole Workspace if it mentions
 * nobody, then goes back to Home, saying once that it
 * went. `workspaceId` is the Workspace the page was drawn for, bound where the form is drawn; it
 * must still be the one the person is in, or nothing is sent. The API decides who is giving it
 * from the session cookie, and who it is for from the message.
 *
 * Treated as a public endpoint, because it is one: the session is read again here and the input
 * is validated again, whatever the form already checked.
 */
export async function giveKudos(
  workspaceId: string,
  _previous: GiveKudosState,
  formData: FormData,
): Promise<GiveKudosState> {
  const input = GiveKudosInput.safeParse({ message: formData.get('message') });
  if (!input.success) {
    return { fieldErrors: { message: 'Write your Kudos.' } };
  }
  if (kudosLength(input.data.message) > MAX_KUDOS_LENGTH) {
    return { fieldErrors: { message: TOO_LONG } };
  }

  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  let next: string;
  try {
    unwrap(
      await apiClient().POST('/v1/workspaces/{workspaceId}/kudos', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
        },
        body: { message: input.data.message },
      }),
    );
    next = ROUTES.homeKudos;
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
