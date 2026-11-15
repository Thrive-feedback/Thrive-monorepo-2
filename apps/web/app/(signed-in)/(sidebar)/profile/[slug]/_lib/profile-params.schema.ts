import { z } from 'zod';
import { PROFILE_SHOWS } from '@/lib/routes.constant';

/** A Profile's slug, which is never longer than 64 characters; a longer one names nobody. */
export const ProfileParams = z.object({
  slug: z.string().min(1).max(64),
});

/**
 * `show` is which of the Profile's lists is open, and `feedback` the piece open over it, so a
 * reload or a shared link comes back to the same place. Any other value is ignored.
 */
export const ProfileSearchParams = z.object({
  show: z.enum(PROFILE_SHOWS).catch(PROFILE_SHOWS[0]),
  feedback: z.uuid().optional().catch(undefined),
});
