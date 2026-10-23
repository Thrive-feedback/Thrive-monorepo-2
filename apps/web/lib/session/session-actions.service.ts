'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiClient } from '@/lib/api-client.service';
import { ROUTES } from '@/lib/routes.constant';
import { forwardCookies } from './forward-cookies.service';
import { startGoogleSignIn } from './google-sign-in.service';
import { toSignInDestination } from './sign-in-destination.constant';
import {
  forgetSignInDestination,
  rememberSignInDestination,
} from './sign-in-destination.service';

/**
 * Only the actions live here: every export of a `'use server'` file can be called from
 * the browser, so nothing that reads data belongs beside them.
 */

/**
 * Sends the visitor to Google, remembering the page they were going to so the way back can land
 * them there. The destination is checked here as well as where it was read: this is an endpoint
 * the browser can call with anything. Nothing to follow forgets whatever an abandoned attempt
 * left behind, so signing in from the landing page lands where it always has.
 */
export async function signIn(destination: string | null): Promise<void> {
  const safe = toSignInDestination(destination);
  if (safe === null) {
    await forgetSignInDestination();
  } else {
    await rememberSignInDestination(safe);
  }
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
