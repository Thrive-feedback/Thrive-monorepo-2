import 'server-only';
import { type operations, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { WorkspaceMember } from './workspace-member.type';

/** A Workspace holds 20–50 people, so one page of the largest size covers it. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/** Whether a Member can still open the Workspace, or has been Deactivated there. */
export type MemberStatus = NonNullable<
  NonNullable<
    operations['WorkspaceMemberController_listWorkspaceMembers']['parameters']['query']
  >['status']
>;

/**
 * Everyone active in the person's Workspace, the person included, or everyone Deactivated there.
 * Not cached across requests: who is in changes the moment someone accepts or leaves.
 */
export async function readMembers(
  membership: CurrentMembership,
  status: MemberStatus = 'ACTIVE',
): Promise<WorkspaceMember[]> {
  return readMembersOf(membership.workspace.id, status);
}

/** `cache` lets Members and the Leave row share one read per request, keyed by plain values. */
const readMembersOf = cache(
  async (
    workspaceId: string,
    status: MemberStatus,
  ): Promise<WorkspaceMember[]> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const members = await apiClient().GET(
      '/v1/workspaces/{workspaceId}/members',
      {
        params: {
          path: { workspaceId },
          header: { cookie },
          query: { ...ONE_PAGE, status },
        },
        cache: 'no-store',
      },
    );
    return unwrap(members).items.map((member) => ({
      accountId: member.accountId,
      email: member.email,
      name: member.displayName,
      photoUrl: member.photoUrl,
      role: member.role,
    }));
  },
);
