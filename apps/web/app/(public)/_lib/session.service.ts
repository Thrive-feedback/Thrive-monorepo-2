import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import { toNeedsRefresh, toSession } from './session.transform';
import type { Session } from './session.type';

/**
 * The API's read of this request's session. `cache` makes the navbar and the page share
 * one API call per request, and never longer. The read changes nothing on the API.
 */
const readCurrentSession = cache(async () => {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const result = await apiClient().GET('/v1/sessions/current', {
    params: { header: { cookie } },
    cache: 'no-store',
  });
  return unwrap(result);
});

/**
 * Who this request is signed in as, asked of the API every time. The proxy only saw that a
 * cookie exists; this is the check that counts, because a cookie can be forged or expired.
 */
export async function readSession(): Promise<Session | null> {
  return toSession(await readCurrentSession());
}

/**
 * Whether the session should be pushed forward now. A server component cannot set the new
 * cookie, so it renders the refresher, which runs the `refreshSession` action instead.
 */
export async function readSessionNeedsRefresh(): Promise<boolean> {
  return toNeedsRefresh(await readCurrentSession());
}
