import 'server-only';
import { cookies } from 'next/headers';
import { parseSetCookie } from './set-cookie.util';

/**
 * The API answered the server, not the browser, so the cookies it set are copied on by hand.
 * Only from a server action: that is the one place Next lets the server set a cookie.
 */
export async function forwardCookies(response: Response): Promise<void> {
  const cookieStore = await cookies();
  for (const header of response.headers.getSetCookie()) {
    const cookie = parseSetCookie(header);
    if (cookie) {
      cookieStore.set(cookie.name, cookie.value, cookie.options);
    }
  }
}
