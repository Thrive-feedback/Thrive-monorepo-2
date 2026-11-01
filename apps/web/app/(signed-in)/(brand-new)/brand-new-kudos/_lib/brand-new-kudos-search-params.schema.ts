import { z } from 'zod';

/**
 * `month` narrows the board to one month, `YYYY-MM`, so a reload or a shared link comes back to it.
 * Anything else shows every month. The page is not here: a cursor cannot be made from a page number,
 * so a reload starts at the first page (ADR 0076).
 */
export const BrandNewKudosSearchParams = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()
    .catch(undefined),
});
