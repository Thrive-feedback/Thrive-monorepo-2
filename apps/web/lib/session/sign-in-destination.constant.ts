import { toSafeDestination } from '@/lib/navigation/safe-destination.util';

/**
 * Where the person was going when Thrive asked them to sign in. Read by the proxy as well as by
 * the pages, so it holds no server-only import.
 */
export const SIGN_IN_DESTINATION_COOKIE = 'thrive.sign_in_destination';

/**
 * Added by the API to the address Google sends someone back to, and the proxy's signal that this
 * request is the way back from signing in.
 */
export const SIGNED_IN_PARAM = 'signedIn';

/**
 * Where signing in may land somebody, or `null` for wherever they belong.
 *
 * A path inside Thrive ([toSafeDestination]), and not one that says it is itself the way back
 * from Google: landing on an address carrying `signedIn` would be read as a fresh arrival and
 * followed again, and again, for as long as the destination survived.
 */
export function toSignInDestination(value: unknown): string | null {
  const path = toSafeDestination(value);
  if (path === null) {
    return null;
  }
  const query = path.indexOf('?');
  const isArrival =
    query !== -1 &&
    new URLSearchParams(path.slice(query + 1)).has(SIGNED_IN_PARAM);
  return isArrival ? null : path;
}
