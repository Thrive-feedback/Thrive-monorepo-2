import { type NextRequest, NextResponse } from 'next/server';
import { ROUTES } from '@/lib/routes.constant';
import { hasSessionCookie } from '@/lib/session/session-cookie.constant';
import {
  SIGN_IN_DESTINATION_COOKIE,
  SIGNED_IN_PARAM,
  toSignInDestination,
} from '@/lib/session/sign-in-destination.constant';

/**
 * Sends a visitor with no session cookie straight to sign-in, carrying where they were going as
 * `next` so signing in can land them on the page the link pointed at rather than on plain Home.
 * Home itself is left off: it is where signing in lands anyway. This is the only place that knows
 * the address a request was for, which is why the destination is taken here.
 *
 * It is only the cheap half of the check: a cookie can be forged or expired, so every page still
 * asks the API who is signed in before it renders anything, and the page the person lands on does
 * its own checking.
 */
export function proxy(request: NextRequest) {
  if (!hasSessionCookie(request.cookies)) {
    const signIn = new URL(ROUTES.signIn, request.url);
    const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    if (destination !== ROUTES.home) {
      signIn.searchParams.set('next', destination);
    }
    return NextResponse.redirect(signIn);
  }
  if (request.nextUrl.searchParams.has(SIGNED_IN_PARAM)) {
    return spendDestination(request);
  }
  return NextResponse.next();
}

/**
 * On the way back from Google, and only there. The destination is spent whether or not it is
 * followed — this is the one point in the round trip that can both redirect and write a cookie,
 * so a destination that outlived its redirect would be followed again every time the person came
 * back to this address, including by pressing Back.
 */
function spendDestination(request: NextRequest) {
  const held = request.cookies.get(SIGN_IN_DESTINATION_COOKIE);
  if (held === undefined) {
    // Signed in from the landing page: nothing to spend, and nothing said to the browser.
    return NextResponse.next();
  }
  const destination = toSignInDestination(held.value);
  const response =
    destination === null
      ? NextResponse.next()
      : NextResponse.redirect(new URL(destination, request.url));
  response.cookies.delete(SIGN_IN_DESTINATION_COOKIE);
  return response;
}

export const config = {
  // Literals, not ROUTES: Next reads the matcher at build time and accepts only constants.
  // Keep it in step with ROUTES.home, ROUTES.register, ROUTES.settings and ROUTES.chooseWorkspace.
  matcher: [
    '/home',
    '/register/:path*',
    '/choose-workspace',
    '/settings',
    // Everything under Settings except where a chat tool returns an Admin: that address carries
    // the tool's authorisation code, which must not be copied into a sign-in address or a cookie.
    // Its page checks the session itself, as every page does.
    '/settings/((?!workspace/integrations/).*)',
  ],
};
