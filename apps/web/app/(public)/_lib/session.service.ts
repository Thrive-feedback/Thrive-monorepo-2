import 'server-only';
import { unwrap } from '@repo/api';
import { headers } from 'next/headers';
import { cache } from 'react';
import { apiClient } from '@/lib/api-client.service';
import { toSession } from './session.transform';
import type { Session } from './session.type';

/**
 * Who this request is signed in as, asked of the API every time. The proxy only saw that a
 * cookie exists; this is the check that counts, because a cookie can be forged or expired.
 *
 * `cache` makes the navbar and the page share one API call per request, and never longer.
 */
export const readSession = cache(async (): Promise<Session | null> => {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const result = await apiClient().GET('/v1/sessions/current', {
    params: { header: { cookie } },
    cache: 'no-store',
  });
  return toSession(unwrap(result));
});
