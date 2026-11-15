import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import type { PersonalItemsPage } from '@/app/(signed-in)/(sidebar)/_lib/personal-item.type';
import { toPersonalItemsPage } from '@/app/(signed-in)/(sidebar)/_lib/personal-item.util';
import { PERSONAL_ITEMS_PAGE_SIZE } from '@/app/(signed-in)/(sidebar)/_lib/read-first-page.service';
import { apiClient } from '@/lib/api-client.service';
import type { ProfileShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** Each list in the address, as the route names it. */
const SHOWS_ON_THE_WIRE = {
  feedback: 'FEEDBACK',
  shared: 'SHARED_WITH_ME',
  kudos: 'KUDOS',
} as const satisfies Record<ProfileShow, string>;

/**
 * One page of one of a Profile's lists, newest first. What was shared is the reader's own, and the
 * reader is the API's to know from the session, so it is not a parameter here. Never cached: what is
 * written must be here at once, and one reader's must never be served to another.
 */
export async function readProfileItems(
  membership: CurrentMembership,
  accountId: string,
  show: ProfileShow,
  cursor?: string,
): Promise<PersonalItemsPage> {
  return toPersonalItemsPage(
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
