import { z } from 'zod';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

/** The paging parameters every collection route takes, with the same names and limits. */
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
