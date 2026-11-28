import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { PERSONAL_ITEMS_PAGE_SIZE } from '@/app/(signed-in)/(sidebar)/_lib/read-first-page.service';
import { apiClient } from '@/lib/api-client.service';
import type { ProfileShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { ProfileItemsPage } from './profile-item.type';
import { toProfileItemsPage } from './profile-item.util';

/** Each list in the address, as the route names it. */
const SHOWS_ON_THE_WIRE = {
  feedback: 'FEEDBACK',
  kudos: 'KUDOS',
  between: 'BETWEEN_US',
  shared: 'SHARED_WITH_ME',
  asks: 'OPEN_ASKS',
} as const satisfies Record<ProfileShow, string>;

/**
 * One page of one of a Profile's lists, newest first. What was shared, and what is between, are the
 * reader's own, and the reader is the API's to know from the session, so it is not a parameter here.
 * Never cached: what is written must be here at once, and one reader's must never be served to
 * another.
 */
export async function readProfileItems(
  membership: CurrentMembership,
  accountId: string,
  show: ProfileShow,
  cursor?: string,
): Promise<ProfileItemsPage> {
  return toProfileItemsPage(
    unwrap(
      await apiClient().GET(
        '/v1/workspaces/{workspaceId}/members/{accountId}/profile-items',
        {
          params: {
            path: { workspaceId: membership.workspace.id, accountId },
            header: { cookie: (await headers()).get('cookie') ?? undefined },
            query: {
              show: SHOWS_ON_THE_WIRE[show],
              cursor,
              limit: PERSONAL_ITEMS_PAGE_SIZE,
            },
          },
          cache: 'no-store',
        },
      ),
    ),
  );
}
