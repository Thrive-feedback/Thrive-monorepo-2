import 'server-only';
import { cookies } from 'next/headers';
import { signInRoundTripCookie } from './sign-in-cookie.util';
import { SIGN_IN_DESTINATION_COOKIE } from './sign-in-destination.constant';

/**
 * Holds where the person was going across the round trip to Google, which comes back to one
 * address Better Auth registered and knows nothing of where the link pointed. The address could
 * not carry it either: everything between here and the way back belongs to Google and to the
 * API's own state. The proxy spends it on arrival, which is also where it is deleted.
 *
 * From a server action only: the one place Next lets the server set a cookie.
 */
export async function rememberSignInDestination(
  destination: string,
): Promise<void> {
  (await cookies()).set(
    SIGN_IN_DESTINATION_COOKIE,
    destination,
    await signInRoundTripCookie(),
  );
}

/**
 * Drops any destination an earlier attempt left behind, so signing in from the landing page lands
 * where signing in from the landing page has always landed.
 */
export async function forgetSignInDestination(): Promise<void> {
  (await cookies()).delete(SIGN_IN_DESTINATION_COOKIE);
}
