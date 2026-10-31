import { z } from 'zod';
import { BRAND_NEW_WAITING_SORTS } from '@/lib/routes.constant';

/**
 * `sort` is the order of the list, and `ask` the Ask open over it, so a reload or a shared link
 * comes back to the same place. Any other value is ignored.
 */
export const BrandNewWaitingSearchParams = z.object({
  sort: z.enum(BRAND_NEW_WAITING_SORTS).catch(BRAND_NEW_WAITING_SORTS[0]),
  ask: z.uuid().optional().catch(undefined),
});
