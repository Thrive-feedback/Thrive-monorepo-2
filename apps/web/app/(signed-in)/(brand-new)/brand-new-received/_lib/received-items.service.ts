import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import type { ReceivedPage } from './received-item.type';
import { toReceivedItem } from './received-item.util';

/** A few screens, so the next page is read before anybody reaches the end of this one. */
const PAGE_SIZE = 20;

/**
 * One page of what was written to the signed-in person, newest first. Whose it is is the API's to
 * decide from the session, so it is not a parameter here, and cannot be. Nothing is cached: a new
 * piece arrives the moment somebody writes one, and one person's must never be served to another.
 */
export async function readReceivedItems(
  membership: CurrentMembership,
  cursor?: string,
): Promise<ReceivedPage> {
  const page = unwrap(
    await apiClient().GET('/v1/workspaces/{workspaceId}/received-items', {
      params: {
        path: { workspaceId: membership.workspace.id },
        header: { cookie: (await headers()).get('cookie') ?? undefined },
        query: { cursor, limit: PAGE_SIZE },
      },
      cache: 'no-store',
    }),
  );
  return {
    readerAccountId: page.readerAccountId,
    items: page.items.flatMap((item) => toReceivedItem(item) ?? []),
    nextCursor: page.nextCursor,
  };
}
