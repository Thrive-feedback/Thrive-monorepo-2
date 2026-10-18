'use server';

import { ApiError } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { requireMemberOf } from '@/lib/session/session.service';

const AccountId = z.uuid();

/** What to say when the API refused a Deactivation, by the API's error code. */
const DEACTIVATION_ERRORS: Readonly<Record<string, string>> = {
  LAST_ADMIN: 'Make someone else an Admin first.',
  NOT_ALLOWED_TO_DEACTIVATE: 'Only Admins can Deactivate other people.',
  MEMBER_NOT_FOUND: 'They are no longer in this Workspace.',
};

/** What to say when the API refused a Reactivation, by the API's error code. */
const REACTIVATION_ERRORS: Readonly<Record<string, string>> = {
  NOT_ALLOWED_TO_REACTIVATE: 'Only Admins can Reactivate people.',
  MEMBER_NOT_FOUND: 'They were never in this Workspace.',
};

const COULD_NOT_DEACTIVATE = "We couldn't do that. Please try again.";

export type MemberDeactivationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

/**
 * Deactivates someone in `workspaceId`, the Workspace the page was drawn for, which must still be
 * the one the person is in; the API checks they may. Members is drawn again either way, the
 * Deactivated person among the Deactivated.
 */
export async function deactivateMember(
  workspaceId: string,
  accountId: string,
): Promise<MemberDeactivationResult> {
  return deactivate(workspaceId, accountId);
}

/**
 * Leaves the person's own Workspace, by Deactivating their own Account there; `accountId` is
 * theirs, as their row in Members names it. Once out they can no longer open it, so they go on
 * to wherever they belong now: the Workspace they used before, if they are in another.
 */
export async function leaveWorkspace(
  workspaceId: string,
  accountId: string,
): Promise<MemberDeactivationResult> {
  const result = await deactivate(workspaceId, accountId);
  if (result.ok) {
    redirect(ROUTES.home);
  }
  return result;
}

/**
 * Reactivates someone Deactivated in `workspaceId`, with the Role they had. As with
 * Deactivating, it must still be the Workspace the person is in, and the API checks they may.
 * Members is drawn again either way, the person back among the active.
 */
export async function reactivateMember(
  workspaceId: string,
  accountId: string,
): Promise<MemberDeactivationResult> {
  const id = AccountId.safeParse(accountId);
  if (!id.success) {
    return { ok: false, message: COULD_NOT_DEACTIVATE };
  }
  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/members/{accountId}/reactivate',
      {
        params: {
          path: { workspaceId: membership.workspace.id, accountId: id.data },
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
      message: REACTIVATION_ERRORS[error.code] ?? COULD_NOT_DEACTIVATE,
    };
  } finally {
    revalidatePath(ROUTES.settings.workspace);
  }
}

async function deactivate(
  workspaceId: string,
  accountId: string,
): Promise<MemberDeactivationResult> {
  const id = AccountId.safeParse(accountId);
  if (!id.success) {
    return { ok: false, message: COULD_NOT_DEACTIVATE };
  }
  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    await apiClient().POST(
      '/v1/workspaces/{workspaceId}/members/{accountId}/deactivate',
      {
        params: {
          path: { workspaceId: membership.workspace.id, accountId: id.data },
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
      message: DEACTIVATION_ERRORS[error.code] ?? COULD_NOT_DEACTIVATE,
    };
  } finally {
    revalidatePath(ROUTES.settings.workspace);
  }
}
