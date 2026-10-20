import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** No limit is set on how many a Workspace has, so this reads the largest page there is. */
const ONE_PAGE = { page: 1, pageSize: 100 };

/**
 * The names of the Workspace's active Workspace Goals, alphabetically, as `#` offers them while
 * Feedback is written. An Admin is answered the hidden ones too, which are never offered, so they
 * are left out here. Not cached across requests: hiding one takes it off the list at once;
 * `cache` only shares one call between the parts of one page.
 */
export const readWorkspaceGoalNames = cache(
  async (membership: CurrentMembership): Promise<string[]> => {
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
    return unwrap(workspaceGoals)
      .items.filter((workspaceGoal) => workspaceGoal.status === 'ACTIVE')
      .map((workspaceGoal) => workspaceGoal.name);
  },
);
