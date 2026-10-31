import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { MyAsk } from '@/lib/feedback/my-ask.type';
import { toMyAsk } from '@/lib/feedback/my-ask.util';
import type { BrandNewWaitingSort } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** As on Home: enough to fill a screen and more, so the next page arrives before the end does. */
const PAGE_SIZE = 20;

const API_SORTS = { newest: 'NEWEST', oldest: 'OLDEST' } as const;

export type WaitingAsksPage = {
  readonly items: readonly MyAsk[];
  readonly nextCursor: string | null;
};

/**
 * One page of the Asks waiting for the signed-in person, in the order chosen. Not cached: an Ask leaves
 * this list the moment it is answered, and one person's Asks must never be served to another.
 */
export async function readWaitingAsks(
  membership: CurrentMembership,
  sort: BrandNewWaitingSort,
  cursor?: string,
): Promise<WaitingAsksPage> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const page = unwrap(
    await apiClient().GET('/v1/workspaces/{workspaceId}/waiting-asks', {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie },
        query: { sort: API_SORTS[sort], limit: PAGE_SIZE, cursor },
      },
      cache: 'no-store',
    }),
  );
  return { items: page.items.map(toMyAsk), nextCursor: page.nextCursor };
}
