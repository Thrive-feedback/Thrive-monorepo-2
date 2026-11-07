import { z } from 'zod';
import { HOME_SHOWS } from '@/lib/routes.constant';

/**
 * Each flag is added by whatever sent the person here, so the page can say once what happened:
 * `signedIn=1` by the API, on the address Google sends a returning person back to; `opened=1` by
 * switching Workspace from the navbar; `left=1` by leaving the Workspace before; and `switched=1`
 * by an action refused because its page was for a Workspace the person is no longer in. `show` is
 * the feed's filter, and `feedback` the piece open over it, so a reload or a shared link comes
 * back to the same place. Any other value is ignored.
 */
export const HomeSearchParams = z.object({
  signedIn: z.literal('1').optional().catch(undefined),
  opened: z.literal('1').optional().catch(undefined),
  left: z.literal('1').optional().catch(undefined),
  switched: z.literal('1').optional().catch(undefined),
  show: z.enum(HOME_SHOWS).catch(HOME_SHOWS[0]),
  feedback: z.uuid().optional().catch(undefined),
});
