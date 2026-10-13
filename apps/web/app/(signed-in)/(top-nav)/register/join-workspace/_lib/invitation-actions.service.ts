'use server';

import { ApiError } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import type { JoinWorkspaceState } from './join-workspace-state.type';

const JoinWorkspaceForm = z.object({ invitationId: z.uuid() });

/** Where to go instead when the API says joining is not the person's to do here. */
const ELSEWHERE: Readonly<Record<string, string>> = {
  // Joined already, from another tab or a second click.
  ALREADY_IN_A_WORKSPACE: ROUTES.home,
  NOT_SIGNED_IN: ROUTES.signIn,
};

/**
 * The Invitation was Pending for this person when the page was drawn and is not now. Not for
 * them can only mean the same: the list holds only Invitations sent to their address.
 */
const NO_LONGER_PENDING = new Set([
  'INVITATION_NOT_FOUND',
  'INVITATION_EXPIRED',
  'INVITATION_REVOKED',
  'INVITATION_ALREADY_ACCEPTED',
  'INVITATION_NOT_FOR_YOU',
]);

/**
 * Accepts the chosen Invitation as the signed-in person, then goes Home in that Workspace. The
 * API checks it was sent to them. One no longer Pending is reported in place and the list is
 * read again, so what is left to choose from is what is still Pending; when nothing is, the page
 * moves on to Create a Workspace as it re-renders.
 */
export async function acceptInvitation(
  _previous: JoinWorkspaceState,
  formData: FormData,
): Promise<JoinWorkspaceState> {
  const form = JoinWorkspaceForm.safeParse({
    invitationId: formData.get('invitationId'),
  });
  if (!form.success) {
    return { refusal: 'failed' };
  }

  const cookie = (await headers()).get('cookie') ?? undefined;
  let next: string = ROUTES.home;
  try {
    await apiClient().POST('/v1/invitations/{invitationId}/accept', {
      params: {
        path: { invitationId: form.data.invitationId },
        header: { cookie },
      },
    });
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (NO_LONGER_PENDING.has(error.code)) {
      revalidatePath(ROUTES.register.joinWorkspace);
      return { refusal: 'noLongerPending' };
    }
    const elsewhere = ELSEWHERE[error.code];
    if (!elsewhere) {
      return { refusal: 'failed' };
    }
    next = elsewhere;
  }
  // Outside the `try`: `redirect` works by throwing, and the catch above would swallow it.
  redirect(next);
}
