import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { toFeedbackPostcard } from '@/app/(signed-in)/(sidebar)/_lib/read-postcard.util';
import { toReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { apiClient } from '@/lib/api-client.service';
import type {
  HomeFeedEntry,
  HomeFeedPage,
  HomeFeedShow,
} from '@/lib/feedback/home-feed-item.type';
import { toHomeFeedItem } from '@/lib/feedback/home-feed-item.util';
import type { HomeShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';

/** A screen and a bit, so the next page is read before anybody reaches the end of this one. */
const PAGE_SIZE = 20;

/** The address's words for each choice, in the API's. */
const API_SHOWS: Readonly<Record<HomeShow, HomeFeedShow>> = {
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
  show: HomeShow,
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
    // Feedback on Home is for at least one person, so each has a postcard: nothing is left out.
    items: page.items.flatMap((item): HomeFeedEntry[] => {
      if (item.kind === 'KUDOS') {
        return [{ kind: item.kind, ...toReadKudos(item) }];
      }
      const card = toFeedbackPostcard(item);
      return card ? [{ kind: item.kind, ...toHomeFeedItem(item), card }] : [];
    }),
    nextCursor: page.nextCursor,
  };
}
