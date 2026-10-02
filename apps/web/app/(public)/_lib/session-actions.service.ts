'use server';

import { unwrap } from '@repo/api';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client.service';
import { parseSetCookie } from './set-cookie.util';

/**
 * Only the two actions live here: every export of a `'use server'` file can be called from
 * the browser, so nothing that reads data belongs beside them.
 */

/** The API answered the server, not the browser, so its cookies are copied on by hand. */
async function forwardCookies(response: Response): Promise<void> {
  const cookieStore = await cookies();
  for (const header of response.headers.getSetCookie()) {
    const cookie = parseSetCookie(header);
    if (cookie) {
      cookieStore.set(cookie.name, cookie.value, cookie.options);
    }
  }
}

export async function signIn(): Promise<void> {
  const result = await apiClient().POST('/v1/sessions/google');
  await forwardCookies(result.response);
  redirect(unwrap(result).url);
}

/** Needs no authorization: it can only ever end the caller's own session. */
export async function signOut(): Promise<void> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const result = await apiClient().DELETE('/v1/sessions/current', {
    params: { header: { cookie } },
  });
  await forwardCookies(result.response);
  redirect('/login');
}
