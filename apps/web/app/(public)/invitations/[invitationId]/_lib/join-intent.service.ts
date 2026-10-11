import 'server-only';
import { cookies, headers } from 'next/headers';

/**
 * Which Invitation the person asked to join by signing in with Google. Clicking that button is
 * the consent; the cookie carries it across the round trip to Google, so the page can join for
 * them on the way back. The address alone could not: anyone can send a signed-in person a link,
 * and joining from a link would let an inviter pull someone into their Workspace unasked.
 *
 * httpOnly and SameSite=Lax: no script or other site can set or read it, and Lax still sends it
 * on Google's top-level redirect back. It lasts only as long as a sign-in plausibly takes.
 */
export const JOIN_INTENT_COOKIE = 'thrive.join_intent';

const TEN_MINUTES_IN_SECONDS = 10 * 60;

/** From a server action only: the one place Next lets the server set a cookie. */
export async function rememberJoinIntent(invitationId: string): Promise<void> {
  const origin = (await headers()).get('origin');
  (await cookies()).set(JOIN_INTENT_COOKIE, invitationId, {
    httpOnly: true,
    sameSite: 'lax',
    // Secure wherever the site is served over https; a local http server would never get it back.
    secure: origin?.startsWith('https:') ?? false,
    path: '/',
    maxAge: TEN_MINUTES_IN_SECONDS,
  });
}

/** Whether the person asked to join this Invitation, and not some other one. */
export async function hasJoinIntentFor(invitationId: string): Promise<boolean> {
  return (await cookies()).get(JOIN_INTENT_COOKIE)?.value === invitationId;
}

/** Spends the intent, so it joins at most once and a refusal does not try again. */
export async function forgetJoinIntent(): Promise<void> {
  (await cookies()).delete(JOIN_INTENT_COOKIE);
}
