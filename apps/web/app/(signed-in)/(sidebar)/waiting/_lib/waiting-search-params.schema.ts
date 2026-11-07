import { z } from 'zod';
import { WAITING_SORTS } from '@/lib/routes.constant';

/**
 * `sort` is the order of the list, and `ask` the Ask open over it, so a reload or a shared link
 * comes back to the same place. Any other value is ignored.
 */
export const WaitingSearchParams = z.object({
  sort: z.enum(WAITING_SORTS).catch(WAITING_SORTS[0]),
  ask: z.uuid().optional().catch(undefined),
});
