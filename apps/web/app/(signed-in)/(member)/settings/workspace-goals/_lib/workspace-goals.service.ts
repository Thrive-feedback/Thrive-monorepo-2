import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { WorkspaceGoal } from './workspace-goal.type';

/** No limit is set on how many a Workspace has, so this reads the largest page there is. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * The Workspace Goals of the person's Workspace, alphabetically: every one for an Admin, the
 * active ones for anyone else — the API decides which. Not cached: adding, hiding or showing one
 * changes it at once.
 */
export async function readWorkspaceGoals(
  membership: CurrentMembership,
): Promise<WorkspaceGoal[]> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const workspaceGoals = await apiClient().GET(
    '/v1/workspaces/{workspaceId}/workspace-goals',
    {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie },
        query: ONE_PAGE,
      },
      cache: 'no-store',
    },
  );
  return unwrap(workspaceGoals).items.map((workspaceGoal) => ({
    id: workspaceGoal.id,
    name: workspaceGoal.name,
    description: workspaceGoal.description,
    status: workspaceGoal.status,
  }));
}
