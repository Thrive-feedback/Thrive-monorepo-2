import { type NextRequest, NextResponse } from 'next/server';
import { ROUTES } from '@/lib/routes.constant';
import { hasSessionCookie } from '@/lib/session/session-cookie.constant';

/**
 * Sends a visitor with no session cookie straight to sign-in, without asking the API. It is
 * only the cheap half of the check: a cookie can be forged or expired, so every page still
 * asks the API who is signed in before it renders anything.
 */
export function proxy(request: NextRequest) {
  if (hasSessionCookie(request.cookies)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(ROUTES.signIn, request.url));
}

export const config = {
  // Literals, not ROUTES: Next reads the matcher at build time and accepts only constants.
  // Keep it in step with ROUTES.home and ROUTES.register.
  matcher: ['/home', '/register/:path*'],
};
