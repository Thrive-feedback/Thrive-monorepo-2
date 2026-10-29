import { z } from 'zod';

/**
 * `opened=1` is added by switching Workspace from the navbar, so the page can say once that it
 * switched. Any other value is ignored.
 */
export const BrandNewHomeSearchParams = z.object({
  opened: z.literal('1').optional().catch(undefined),
});
