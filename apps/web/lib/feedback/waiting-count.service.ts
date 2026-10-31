import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/**
 * How many Asks are waiting for the signed-in person, however many that is. It reads the offset
 * list for its `total`, which the cursor list has none of (ADR 0059). Not cached across requests:
 * the number drops the moment they answer one.
 */
export const readWaitingCount = cache(
  async (membership: CurrentMembership): Promise<number> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    const waiting = unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/feedback-asks', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
          query: { page: 1, pageSize: 1, status: 'PENDING' },
        },
        cache: 'no-store',
      }),
    );
    return waiting.total;
  },
);
