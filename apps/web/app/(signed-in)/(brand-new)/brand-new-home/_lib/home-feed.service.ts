import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { toReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { apiClient } from '@/lib/api-client.service';
import type {
  HomeFeedPage,
  HomeFeedShow,
} from '@/lib/feedback/home-feed-item.type';
import { toHomeFeedItem } from '@/lib/feedback/home-feed-item.util';
import type { BrandNewHomeShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** A screen and a bit, so the next page is read before anybody reaches the end of this one. */
const PAGE_SIZE = 20;

/** The address's words for each choice, in the API's. */
const API_SHOWS: Readonly<Record<BrandNewHomeShow, HomeFeedShow>> = {
  all: 'ALL',
  everyone: 'EVERYONE',
  shared: 'SHARED_WITH_ME',
};

/**
 * One page of what the signed-in person reads on Home, newest first. Who they are is the API's to
 * decide from the session, so it is not a parameter here, and cannot be. Nothing is cached: the
 * feed changes the moment somebody shares, and what one person reads is not another's.
 */
export async function readHomeFeed(
  membership: CurrentMembership,
  show: BrandNewHomeShow,
  cursor?: string,
): Promise<HomeFeedPage> {
  const page = unwrap(
    await apiClient().GET('/v1/workspaces/{workspaceId}/feed-items', {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie: (await headers()).get('cookie') ?? undefined },
        query: { show: API_SHOWS[show], cursor, limit: PAGE_SIZE },
      },
      cache: 'no-store',
    }),
  );
  return {
    readerAccountId: page.readerAccountId,
    items: page.items.map((item) =>
      item.kind === 'KUDOS'
        ? { kind: item.kind, ...toReadKudos(item) }
        : { kind: item.kind, ...toHomeFeedItem(item) },
    ),
    nextCursor: page.nextCursor,
  };
}
