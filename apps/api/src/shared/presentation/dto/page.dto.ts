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

/**
 * The cursor every collection route will take instead of `page` (ADR 0059): opaque to a client,
 * which only ever sends back the `nextCursor` it was given. It is the base64url of the id of the
 * last row sent; one that does not decode to an id is refused as an invalid request.
 */
export const cursorQueryShape = {
  cursor: z
    .string()
    .optional()
    .transform((cursor, context) => {
      if (cursor === undefined) {
        return null;
      }
      const id = Buffer.from(cursor, 'base64url').toString('utf8');
      if (!z.uuid().safeParse(id).success) {
        context.addIssue({ code: 'custom', message: 'Not a cursor.' });
        return z.NEVER;
      }
      return id;
    }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
};

/** The paging field a cursor-paged response carries beside its `items`; `null` on the last page. */
export const cursorResultShape = {
  nextCursor: z.string().nullable(),
};

/** The opaque cursor for the page after the row with this id, or `null` when there is none. */
export function toCursor(afterId: string | null): string | null {
  return afterId === null ? null : Buffer.from(afterId).toString('base64url');
}
