import { z } from 'zod';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

/**
 * The paging parameters every collection route takes, with the same names and limits, in every
 * module. It lives in `shared/presentation/` rather than in the module that needed it first:
 * one module may not reach into another's `presentation/` (`BE_03` R4), and two copies of one
 * wire contract is the thing `BE_07` R5 exists to prevent.
 */
export const pageQueryShape = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
};

/** The paging fields every collection response carries beside its `items`. */
export const pageResultShape = {
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
};
