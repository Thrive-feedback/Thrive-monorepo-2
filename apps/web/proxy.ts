import { type NextRequest, NextResponse } from 'next/server';

/**
 * Better Auth's session cookie (ADR 0026). It carries the `__Secure-` prefix on https.
 */
const SESSION_COOKIES = [
  'thrive.session_token',
  '__Secure-thrive.session_token',
];

/**
 * Sends a visitor with no session cookie straight to sign-in, without asking the API. It is
 * only the cheap half of the check: a cookie can be forged or expired, so every page still
 * asks the API who is signed in before it renders anything.
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );
  if (hasSessionCookie) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/home', '/register/:path*'],
};
