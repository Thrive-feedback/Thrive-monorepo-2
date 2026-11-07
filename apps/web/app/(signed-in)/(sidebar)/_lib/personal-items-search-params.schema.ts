import { z } from 'zod';
import {
  BRAND_NEW_PERSONAL_VIEWS,
  BRAND_NEW_RECEIVED_SHOWS,
} from '@/lib/routes.constant';

/**
 * `view` is how Received or Given is laid out, and `feedback` the piece open over it, so a reload or
 * a shared link comes back to the same place. Any other value is ignored.
 */
export const PersonalItemsSearchParams = z.object({
  view: z.enum(BRAND_NEW_PERSONAL_VIEWS).catch(BRAND_NEW_PERSONAL_VIEWS[0]),
  feedback: z.uuid().optional().catch(undefined),
});

/** Received's, which is also narrowed to one kind by `show`, kept in the address the same way. */
export const ReceivedItemsSearchParams = PersonalItemsSearchParams.extend({
  show: z.enum(BRAND_NEW_RECEIVED_SHOWS).catch(BRAND_NEW_RECEIVED_SHOWS[0]),
});
