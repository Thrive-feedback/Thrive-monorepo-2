import 'server-only';
import { headers } from 'next/headers';

const TEN_MINUTES_IN_SECONDS = 10 * 60;

/**
 * How a cookie that has to survive the round trip to Google is set, for the two things worth
 * remembering across it: which Invitation the person chose to join, and where they were going.
 *
 * httpOnly and SameSite=Lax: no script or other site can set or read it, and Lax still sends it
 * on Google's top-level redirect back. It lasts only as long as a sign-in plausibly takes.
 */
export async function signInRoundTripCookie(): Promise<{
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
}> {
  const origin = (await headers()).get('origin');
  return {
    httpOnly: true,
    sameSite: 'lax',
    // Secure unless the site is being served over plain http, where the browser would never send
    // the cookie back. An origin Thrive cannot read is treated as https, so a header that goes
    // missing costs a local sign-in rather than the flag that protects a deployed one.
    secure: !origin?.startsWith('http://'),
    path: '/',
    maxAge: TEN_MINUTES_IN_SECONDS,
  };
}
