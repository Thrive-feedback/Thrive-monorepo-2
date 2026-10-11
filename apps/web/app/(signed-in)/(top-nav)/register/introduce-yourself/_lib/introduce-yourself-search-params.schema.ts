import { z } from 'zod';

/**
 * `signedIn=1` is added by the API to the address Google sends a new person back to, so the
 * page can say once that they are signed in. Any other value is ignored.
 */
export const IntroduceYourselfSearchParams = z.object({
  signedIn: z.literal('1').optional().catch(undefined),
});
