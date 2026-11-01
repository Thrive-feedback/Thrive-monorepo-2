import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { toReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { KUDOS_BOARD_READ_SIZE } from './kudos-board.constant';
import type { KudosBoardMonths, KudosBoardPage } from './kudos-board.type';

/**
 * One read of the board, newest first, which every Member reads. `month` narrows it, and `cursor` is
 * where the read before it ended. Nothing is cached across requests: a Kudos shows the moment it is
 * given.
 */
export async function readKudosBoardPage(
  membership: CurrentMembership,
  month: string | undefined,
  cursor?: string,
): Promise<KudosBoardPage> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const page = unwrap(
    await apiClient().GET('/v1/workspaces/{workspaceId}/kudos', {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie },
        query: { limit: KUDOS_BOARD_READ_SIZE, month, cursor },
      },
      cache: 'no-store',
    }),
  );
  return {
    items: page.items.map(toReadKudos),
    nextCursor: page.nextCursor,
  };
}

/**
 * The Workspace's Kudos counted, in all and by month. The filter and the board's page count both
 * need it, so `cache` makes that one call; nothing is cached across requests.
 */
export const readKudosBoardMonths = cache(
  async (membership: CurrentMembership): Promise<KudosBoardMonths> => {
    const cookie = (await headers()).get('cookie') ?? undefined;
    return unwrap(
      await apiClient().GET('/v1/workspaces/{workspaceId}/kudos/months', {
        params: {
          path: { workspaceId: membership.workspace.id },
          header: { cookie },
        },
        cache: 'no-store',
      }),
    );
  },
);
