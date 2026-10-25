import { z } from 'zod';
import { HOME_TABS } from '@/lib/routes.constant';

/**
 * `signedIn=1` is added by the API to the address Google sends a returning person back to, so the
 * page can say once that they are signed in. `sent=1` is added by sending a Feedback Request, and
 * `given=1` by giving Feedback without being asked, and `kudos=1` by giving Kudos, so the page
 * can say once that it went;
 * `switched=1` by any action refused because its page was for a Workspace the person is no longer
 * in, `opened=1` by switching to the Workspace shown, and `left=1` by leaving the one before, so
 * the page can say so once. `tab`
 * is the feed tab that is open; a missing or unknown one opens the first. `request`, `ask` or
 * `feedback` is the Feedback Request, Ask or piece of Feedback open in a dialog over the tab,
 * kept here so a reload or a shared link opens it again. Any other value is ignored.
 */
export const HomeSearchParams = z.object({
  signedIn: z.literal('1').optional().catch(undefined),
  sent: z.literal('1').optional().catch(undefined),
  given: z.literal('1').optional().catch(undefined),
  kudos: z.literal('1').optional().catch(undefined),
  switched: z.literal('1').optional().catch(undefined),
  opened: z.literal('1').optional().catch(undefined),
  left: z.literal('1').optional().catch(undefined),
  tab: z.enum(HOME_TABS).catch(HOME_TABS[0]),
  request: z.uuid().optional().catch(undefined),
  ask: z.uuid().optional().catch(undefined),
  feedback: z.uuid().optional().catch(undefined),
});
