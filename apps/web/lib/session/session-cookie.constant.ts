/**
 * Better Auth's session cookie (ADR 0027). It carries the `__Secure-` prefix on https.
 */
export const SESSION_COOKIES = [
  'thrive.session_token',
  '__Secure-thrive.session_token',
] as const;

/** Anything that can say whether it holds a cookie: a request's cookies, or `cookies()`. */
type CookieHolder = { has(name: string): boolean };

/**
 * Whether the request carries a session cookie at all. Only the cheap half of the check: a
 * cookie can be forged or expired, so a page that lets someone in still asks the API.
 */
export function hasSessionCookie(cookies: CookieHolder): boolean {
  return SESSION_COOKIES.some((name) => cookies.has(name));
}
