'use server';

import { ApiError, type operations, unwrap } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import type { Invitee } from '@/lib/invitations/invite-emails.util';
import { ROUTES } from '@/lib/routes.constant';
import { requireMemberOf } from '@/lib/session/session.service';
import { checkEmailList, parseEmailList } from './email-list.util';
import type { InviteMembersState } from './invite-members-state.type';

const InvitationId = z.uuid();

/** What to say when the API refused a revoke, by the API's error code. */
const REVOKE_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_REVOKE_INVITATIONS: 'Only Admins can revoke Invitations.',
  INVITATION_ALREADY_ACCEPTED: 'They have already joined.',
  INVITATION_REVOKED: 'That Invitation was already revoked.',
};

const COULD_NOT_REVOKE =
  "We couldn't revoke that Invitation. Please try again.";

/** What to say when the API refused a resend, by the API's error code. */
const RESEND_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_RESEND_INVITATIONS: 'Only Admins can resend Invitations.',
  INVITATION_ALREADY_ACCEPTED: 'They have already joined.',
  INVITATION_REVOKED: 'That Invitation was revoked.',
  INVITATION_RESENT_TOO_SOON:
    'You sent this a moment ago. Try again in a few minutes.',
  ALREADY_A_MEMBER: 'They have already joined.',
};

const COULD_NOT_RESEND =
  "We couldn't resend that Invitation. Please try again.";

/** Revoke and resend name an Invitation the same way. */
type InvitationParams =
  operations['InvitationController_resendInvitation']['parameters'];

export type InvitationActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

/**
 * Acts on an Invitation to `workspaceId`, the Workspace the page was drawn for, which must still
 * be the one the person is in; the API checks they may act. Members is drawn again either way,
 * so the list shows where the Invitation now stands.
 */
async function actOnInvitation(
  workspaceId: string,
  invitationId: string,
  errors: Readonly<Record<string, string>>,
  fallback: string,
  call: (params: InvitationParams) => Promise<unknown>,
): Promise<InvitationActionResult> {
  const id = InvitationId.safeParse(invitationId);
  if (!id.success) {
    return { ok: false, message: fallback };
  }
  const { membership } = await requireMemberOf(workspaceId);
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
    revalidatePath(ROUTES.settings.members);
  }
}

/** Revokes an Invitation, so its link stops working. */
export async function revokeInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<InvitationActionResult> {
  return actOnInvitation(
    workspaceId,
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
  workspaceId: string,
  invitationId: string,
): Promise<InvitationActionResult> {
  return actOnInvitation(
    workspaceId,
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
  NOT_ALLOWED_TO_INVITE: 'Only Admins can send Invitations.',
  TOO_MANY_INVITATIONS: 'You can invite up to 10 people at a time.',
};

const COULD_NOT_INVITE = "We couldn't send your Invitations. Please try again.";

const InviteInvitations = z
  .array(z.object({ email: z.string(), role: z.enum(['ADMIN', 'MEMBER']) }))
  .min(1);

/**
 * Invites each person to `workspaceId`, the Workspace the page was drawn for, which must still be
 * the one the person is in, with the Role chosen for them, answering what happened to each. The
 * list is checked again here, whatever the form already checked, and Members is drawn again so
 * Open invitations shows the new ones.
 */
export async function inviteMembers(
  workspaceId: string,
  invitations: readonly Invitee[],
): Promise<InviteMembersState> {
  const input = InviteInvitations.safeParse(invitations);
  const given = input.success ? input.data : [];
  const list = parseEmailList(given.map((i) => i.email).join('\n'));
  const refusal = checkEmailList(list);
  if (refusal) {
    return { formError: refusal };
  }
  // The list merges repeats and keeps the first spelling, so each keeps that entry's Role.
  const roleOf = new Map<string, Invitee['role']>();
  for (const { email, role } of given) {
    const key = email.trim().toLowerCase();
    if (!roleOf.has(key)) {
      roleOf.set(key, role);
    }
  }

  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    const { results } = unwrap(
      await apiClient().POST('/v1/workspaces/{workspaceId}/invitations', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
        },
        body: {
          invitations: list.emails.map((email) => ({
            email,
            role: roleOf.get(email.toLowerCase()) ?? 'MEMBER',
          })),
        },
      }),
    );
    revalidatePath(ROUTES.settings.members);
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
