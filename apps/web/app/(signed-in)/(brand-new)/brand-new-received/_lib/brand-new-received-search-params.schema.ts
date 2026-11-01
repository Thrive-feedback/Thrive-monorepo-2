import { z } from 'zod';
import { BRAND_NEW_RECEIVED_VIEWS } from '@/lib/routes.constant';

/**
 * `view` is how Received is laid out, and `feedback` the piece open over it, so a reload or a shared
 * link comes back to the same place. Any other value is ignored.
 */
export const BrandNewReceivedSearchParams = z.object({
  view: z.enum(BRAND_NEW_RECEIVED_VIEWS).catch(BRAND_NEW_RECEIVED_VIEWS[0]),
  feedback: z.uuid().optional().catch(undefined),
});
