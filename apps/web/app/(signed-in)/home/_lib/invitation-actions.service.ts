'use server';

import { ApiError } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { requireMember } from '@/lib/session/session.service';

const InvitationId = z.uuid();

/** What to say when the API refused, by the API's error code. */
const REVOKE_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_REVOKE_INVITATIONS:
    'Only the Owner and Admins can revoke invitations.',
  INVITATION_ALREADY_ACCEPTED: 'They have already joined.',
  INVITATION_REVOKED: 'That invitation was already revoked.',
};

const COULD_NOT_REVOKE =
  "We couldn't revoke that invitation. Please try again.";

export type RevokeInvitationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

/**
 * Revokes an Invitation to the person's own Workspace. The Workspace is the one the session
 * belongs to, never one the browser names, and the API checks they may revoke. Home is drawn
 * again either way, so the list shows where the Invitation now stands.
 */
export async function revokeInvitation(
  invitationId: string,
): Promise<RevokeInvitationResult> {
  const id = InvitationId.safeParse(invitationId);
  if (!id.success) {
    return { ok: false, message: COULD_NOT_REVOKE };
  }
  const { membership } = await requireMember();
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/invitations/{invitationId}/revoke',
      {
        params: {
          path: { workspaceId: membership.workspace.id, invitationId: id.data },
          header: { cookie },
        },
      },
    );
    return { ok: true };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return {
      ok: false,
      message: REVOKE_ERRORS[error.code] ?? COULD_NOT_REVOKE,
    };
  } finally {
    revalidatePath(ROUTES.home);
  }
}
