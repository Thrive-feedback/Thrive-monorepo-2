import { z } from 'zod';
import { HOME_TABS } from '@/lib/routes.constant';

/**
 * `signedIn=1` is added by the API to the address Google sends a returning person back to, so the
 * page can say once that they are signed in. `sent=1` is added by sending a Feedback Request, so
 * the page can say once that it went. `tab` is the feed tab that is open; a missing or unknown
 * one opens the first. `request` or `ask` is the Feedback Request or Ask open in a dialog over the
 * tab, kept here so a reload or a shared link opens it again. Any other value is ignored.
 */
export const HomeSearchParams = z.object({
  signedIn: z.literal('1').optional().catch(undefined),
  sent: z.literal('1').optional().catch(undefined),
  tab: z.enum(HOME_TABS).catch(HOME_TABS[0]),
  request: z.uuid().optional().catch(undefined),
  ask: z.uuid().optional().catch(undefined),
});
