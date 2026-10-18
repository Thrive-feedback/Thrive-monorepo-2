'use server';

import { ApiError } from '@repo/api';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import type { MemberRole } from '@/lib/session/current-account.type';
import { requireMemberOf } from '@/lib/session/session.service';

const RoleChange = z.object({
  accountId: z.uuid(),
  role: z.enum(['ADMIN', 'MEMBER']),
});

/** What to say when the API refused a Role change, by the API's error code. */
const ROLE_CHANGE_ERRORS: Readonly<Record<string, string>> = {
  LAST_ADMIN: 'Make someone else an Admin first.',
  NOT_ALLOWED_TO_CHANGE_ROLES: 'Only Admins can change Roles.',
  MEMBER_NOT_FOUND: 'They are no longer in this Workspace.',
};

const COULD_NOT_CHANGE_ROLE =
  "We couldn't change their Role. Please try again.";

export type MemberRoleActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

/**
 * Makes someone in `workspaceId`, the Workspace the page was drawn for, an Admin or a Member; it
 * must still be the one the person is in, and the API checks they may. Members is drawn
 * again either way, so every Role shows where it now stands — including the person's own, which
 * takes their controls away if they made themselves a Member.
 */
export async function changeMemberRole(
  workspaceId: string,
  accountId: string,
  role: MemberRole,
): Promise<MemberRoleActionResult> {
  const input = RoleChange.safeParse({ accountId, role });
  if (!input.success) {
    return { ok: false, message: COULD_NOT_CHANGE_ROLE };
  }
  const { membership } = await requireMemberOf(workspaceId);
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    await apiClient().PATCH(
      '/v1/workspaces/{workspaceId}/members/{accountId}',
      {
        params: {
          path: {
            workspaceId: membership.workspace.id,
            accountId: input.data.accountId,
          },
          header: { cookie },
        },
        body: { role: input.data.role },
      },
    );
    return { ok: true };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return {
      ok: false,
      message: ROLE_CHANGE_ERRORS[error.code] ?? COULD_NOT_CHANGE_ROLE,
    };
  } finally {
    revalidatePath(ROUTES.settings.workspace);
  }
}
