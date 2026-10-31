import { z } from 'zod';
import { BRAND_NEW_HOME_SHOWS } from '@/lib/routes.constant';

/**
 * `opened=1` is added by switching Workspace from the navbar, so the page can say once that it
 * switched. `show` is the feed's filter, and `feedback` the piece open over it, so a reload or a
 * shared link comes back to the same place. Any other value is ignored.
 */
export const BrandNewHomeSearchParams = z.object({
  opened: z.literal('1').optional().catch(undefined),
  show: z.enum(BRAND_NEW_HOME_SHOWS).catch(BRAND_NEW_HOME_SHOWS[0]),
  feedback: z.uuid().optional().catch(undefined),
});
