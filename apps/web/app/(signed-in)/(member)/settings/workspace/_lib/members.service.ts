import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { WorkspaceMember } from './workspace-member.type';

/** A Workspace holds 20–50 people, so one page of the largest size covers it. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/** Everyone in the person's Workspace, the person included. Not cached: who is in changes the moment someone accepts. */
export async function readMembers(
  membership: CurrentMembership,
): Promise<WorkspaceMember[]> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const members = await apiClient().GET(
    '/v1/workspaces/{workspaceId}/members',
    {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie },
        query: ONE_PAGE,
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
}
