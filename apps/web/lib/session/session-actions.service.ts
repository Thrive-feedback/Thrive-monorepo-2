'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { forwardCookies } from './forward-cookies.service';
import { startGoogleSignIn } from './google-sign-in.service';

/**
 * Only the actions live here: every export of a `'use server'` file can be called from
 * the browser, so nothing that reads data belongs beside them.
 */

export async function signIn(): Promise<void> {
  await startGoogleSignIn(null);
}

/**
 * Pushes the caller's session forward and hands the browser the cookie that matches, so
 * someone who keeps using Thrive is never signed out. No redirect: setting the cookie makes
 * Next render the route again. Needs no authorization: it only touches the caller's own
 * session.
 */
export async function refreshSession(): Promise<void> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const result = await apiClient().POST('/v1/sessions/current/refresh', {
    params: { header: { cookie } },
  });
  await forwardCookies(result.response);
}

/** Needs no authorization: it can only ever end the caller's own session. */
export async function signOut(): Promise<void> {
  const cookie = (await headers()).get('cookie') ?? undefined;
  const result = await apiClient().DELETE('/v1/sessions/current', {
    params: { header: { cookie } },
  });
  await forwardCookies(result.response);
  redirect(ROUTES.signIn);
}
