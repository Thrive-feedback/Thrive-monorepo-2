'use server';

import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import type { SendInvitationsState } from './invite-teammates-state.type';

const SendInvitationsInput = z.array(z.string()).min(1);

/** What to say when the API refused the whole send, by the API's error code. */
const SEND_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_INVITE: 'Only the Owner and Admins can invite teammates.',
  TOO_MANY_INVITATIONS: 'You can invite up to 10 teammates at a time.',
};

/** Where to go instead when the API says this step is not the person's to take. */
const ELSEWHERE: Readonly<Record<string, string>> = {
  NOT_SIGNED_IN: ROUTES.signIn,
  // Left the Workspace from another tab: there is nothing here to invite into.
  WORKSPACE_NOT_FOUND: ROUTES.home,
};

const COULD_NOT_SEND = "We couldn't send your invitations. Please try again.";

/**
 * Invites the addresses to the person's own Workspace. The Workspace is the one the session
 * belongs to, never one the browser names, and the API decides who is inviting from the
 * browser's own session cookie.
 */
export async function sendInvitations(
  emails: readonly string[],
): Promise<SendInvitationsState> {
  const input = SendInvitationsInput.safeParse(emails);
  if (!input.success) {
    return { formError: COULD_NOT_SEND };
  }

  const { membership } = await requireMember();
  const cookie = (await headers()).get('cookie') ?? undefined;
  let next: string;
  try {
    const { results } = unwrap(
      await apiClient().POST('/v1/workspaces/{workspaceId}/invitations', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
        },
        body: { emails: input.data },
      }),
    );
    return {
      results: results.map((result) => ({
        email: result.email,
        outcome: result.outcome,
      })),
    };
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
