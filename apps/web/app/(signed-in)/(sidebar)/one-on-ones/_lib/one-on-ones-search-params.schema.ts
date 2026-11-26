import { z } from 'zod';

/**
 * `with` is the 1:1 open under the strip, so a reload or a shared link comes back to it. Anything
 * that is not an id opens the first one instead.
 */
export const OneOnOnesSearchParams = z.object({
  with: z.uuid().optional().catch(undefined),
});
