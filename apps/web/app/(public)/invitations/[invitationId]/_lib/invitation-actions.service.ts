'use server';

import { ApiError } from '@repo/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { forwardCookies } from '@/lib/session/forward-cookies.service';
import { startGoogleSignIn } from '@/lib/session/google-sign-in.service';
import type {
  AcceptInvitationRefusal,
  AcceptInvitationState,
} from './accept-invitation-state.type';

/**
 * Only the actions live here: every export of a `'use server'` file can be called from the
 * browser, so each checks the id it was handed before using it.
 */

const InvitationId = z.uuid();

/** Refusals the page explains in place, by the API's error code. */
const REFUSALS: Readonly<Record<string, AcceptInvitationRefusal>> = {
  INVITATION_NOT_FOR_YOU: 'notForYou',
  ALREADY_IN_A_WORKSPACE: 'alreadyInAWorkspace',
};

/**
 * Refusals the Invitation page already explains once it is opened again: it has been used,
 * revoked or has expired since the page was drawn, or the person is no longer signed in.
 */
const SHOWN_BY_THE_PAGE = new Set([
  'NOT_SIGNED_IN',
  'INVITATION_NOT_FOUND',
  'INVITATION_EXPIRED',
  'INVITATION_REVOKED',
  'INVITATION_ALREADY_ACCEPTED',
]);

/** Signs in with Google, coming back to this Invitation afterwards. */
export async function signInToAccept(invitationId: string): Promise<void> {
  const id = InvitationId.safeParse(invitationId);
  if (!id.success) {
    redirect(ROUTES.signIn);
  }
  await startGoogleSignIn(id.data);
}

/**
 * Signs out, then straight back in with Google, which asks which account to use, and returns to
 * this Invitation. For someone signed in with an address the Invitation was not sent to.
 */
export async function useAnotherGoogleAccount(
  invitationId: string,
): Promise<void> {
  const id = InvitationId.safeParse(invitationId);
  if (!id.success) {
    redirect(ROUTES.signIn);
  }
  const cookie = (await headers()).get('cookie') ?? undefined;
  const signedOut = await apiClient().DELETE('/v1/sessions/current', {
    params: { header: { cookie } },
  });
  await forwardCookies(signedOut.response);
  await startGoogleSignIn(id.data);
}

/**
 * Accepts the Invitation as the signed-in person; the API checks it was sent to them. Joined,
 * or already in that Workspace, they go where they belong now: Introduce yourself if they
 * have not yet, otherwise Home.
 */
export async function acceptInvitation(
  invitationId: string,
): Promise<AcceptInvitationState> {
  const id = InvitationId.safeParse(invitationId);
  if (!id.success) {
    return { refusal: 'failed' };
  }
  const cookie = (await headers()).get('cookie') ?? undefined;
  let next: string;
  try {
    await apiClient().POST('/v1/invitations/{invitationId}/accept', {
      params: { path: { invitationId: id.data }, header: { cookie } },
    });
    next = ROUTES.home;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    const refusal = REFUSALS[error.code];
    if (refusal) {
      return { refusal };
    }
    if (!SHOWN_BY_THE_PAGE.has(error.code)) {
      return { refusal: 'failed' };
    }
    next = ROUTES.invitation(id.data);
  }
  // Outside the `try`: `redirect` works by throwing, and the catch above would swallow it.
  redirect(next);
}
