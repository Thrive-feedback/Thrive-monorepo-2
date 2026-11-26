import 'server-only';
import { cookies } from 'next/headers';
import { readSession } from './session.service';
import { hasSessionCookie } from './session-cookie.constant';

/**
 * Whether this request is signed in, for a public page that sends someone signed in on to Home.
 * The API is asked only when a session cookie is present, so a visitor without one is answered
 * without it, and the page stays up while the API is down.
 *
 * Throws when a cookie is present and the API fails, as `readSession` does, so the page's error
 * boundary shows. A page that must never fail on top of what it says, such as `not-found.tsx`,
 * keeps its own check that counts a failed read as signed out.
 */
export async function isSignedIn(): Promise<boolean> {
  return hasSessionCookie(await cookies()) && Boolean(await readSession());
}
