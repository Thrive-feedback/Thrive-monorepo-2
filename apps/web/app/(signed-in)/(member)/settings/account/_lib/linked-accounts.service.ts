import 'server-only';
import { ApiError, unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client.service';
import type { LinkedAccount } from './linked-account.type';

/**
 * The caller's own linked chat accounts. There is no Workspace and no account id anywhere in
 * this call: the API answers for whoever the session is, so there is no shape of request that
 * reads somebody else's.
 *
 * A failure reads as "nothing linked" rather than breaking Settings: the rest of the page is
 * the person's Profile, which has nothing to do with chat tools.
 */
export async function readLinkedAccounts(): Promise<readonly LinkedAccount[]> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  try {
    return unwrap(
      await apiClient().GET('/v1/linked-accounts/mine', {
        params: { header: { cookie } },
      }),
    ).items;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    return [];
  }
}
