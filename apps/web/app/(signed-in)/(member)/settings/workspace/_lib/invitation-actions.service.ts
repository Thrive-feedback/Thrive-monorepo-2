'use server';

import { ApiError, type operations, unwrap } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';
import { checkEmailList, parseEmailList } from './email-list.util';
import type { InviteMembersState } from './invite-members-state.type';

const InvitationId = z.uuid();

/** What to say when the API refused a revoke, by the API's error code. */
const REVOKE_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_REVOKE_INVITATIONS:
    'Only the Owner and Admins can revoke invitations.',
  INVITATION_ALREADY_ACCEPTED: 'They have already joined.',
  INVITATION_REVOKED: 'That invitation was already revoked.',
};

const COULD_NOT_REVOKE =
  "We couldn't revoke that invitation. Please try again.";

/** What to say when the API refused a resend, by the API's error code. */
const RESEND_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_RESEND_INVITATIONS:
    'Only the Owner and Admins can resend invitations.',
  INVITATION_ALREADY_ACCEPTED: 'They have already joined.',
  INVITATION_REVOKED: 'That invitation was revoked.',
  INVITATION_RESENT_TOO_SOON:
    'You sent this a moment ago. Try again in a few minutes.',
  ALREADY_A_MEMBER: 'They have already joined.',
};

const COULD_NOT_RESEND =
  "We couldn't send that invitation again. Please try again.";

/** Revoke and resend name an Invitation the same way. */
type InvitationParams =
  operations['InvitationController_resendInvitation']['parameters'];

export type InvitationActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

/**
 * Acts on an Invitation to the person's own Workspace. The Workspace is the one the session
 * belongs to, never one the browser names, and the API checks they may act. Members is drawn
 * again either way, so the list shows where the Invitation now stands.
 */
async function actOnInvitation(
  invitationId: string,
  errors: Readonly<Record<string, string>>,
  fallback: string,
  call: (params: InvitationParams) => Promise<unknown>,
): Promise<InvitationActionResult> {
  const id = InvitationId.safeParse(invitationId);
  if (!id.success) {
    return { ok: false, message: fallback };
  }
  const { membership } = await requireMember();
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    await call({
      path: { workspaceId: membership.workspace.id, invitationId: id.data },
      header: { cookie },
    });
    return { ok: true };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return { ok: false, message: errors[error.code] ?? fallback };
  } finally {
    revalidatePath(ROUTES.settings.workspace);
  }
}

/** Revokes an Invitation, so its link stops working. */
export async function revokeInvitation(
  invitationId: string,
): Promise<InvitationActionResult> {
  return actOnInvitation(
    invitationId,
    REVOKE_ERRORS,
    COULD_NOT_REVOKE,
    (params) =>
      apiClient().POST(
        '/v1/workspaces/{workspaceId}/invitations/{invitationId}/revoke',
        { params },
      ),
  );
}

/** Sends an Invitation's email again, good for another 7 days. */
export async function resendInvitation(
  invitationId: string,
): Promise<InvitationActionResult> {
  return actOnInvitation(
    invitationId,
    RESEND_ERRORS,
    COULD_NOT_RESEND,
    (params) =>
      apiClient().POST(
        '/v1/workspaces/{workspaceId}/invitations/{invitationId}/resend',
        { params },
      ),
  );
}

/** What to say when the API refused the whole send, by its error code. */
const INVITE_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_INVITE: 'Only the Owner and Admins can invite teammates.',
  TOO_MANY_INVITATIONS: 'You can invite up to 10 people at a time.',
};

const COULD_NOT_INVITE = "We couldn't send your invitations. Please try again.";

const InviteEmails = z.array(z.string()).min(1);

/**
 * Invites the addresses to the person's own Workspace, answering what happened to each. The
 * Workspace is the one the session belongs to, never one the browser names. The list is checked
 * again here, whatever the form already checked, and Members is drawn again so Open invitations
 * shows the new ones.
 */
export async function inviteMembers(
  emails: readonly string[],
): Promise<InviteMembersState> {
  const input = InviteEmails.safeParse(emails);
  const list = parseEmailList(input.success ? input.data.join('\n') : '');
  const refusal = checkEmailList(list);
  if (refusal) {
    return { formError: refusal };
  }

  const { membership } = await requireMember();
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    const { results } = unwrap(
      await apiClient().POST('/v1/workspaces/{workspaceId}/invitations', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
        },
        body: { emails: [...list.emails] },
      }),
    );
    revalidatePath(ROUTES.settings.workspace);
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
    if (error.code === 'NOT_SIGNED_IN') {
      redirect(ROUTES.signIn);
    }
    return { formError: INVITE_ERRORS[error.code] ?? COULD_NOT_INVITE };
  }
}
