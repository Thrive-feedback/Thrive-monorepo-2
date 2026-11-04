import { z } from 'zod';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const cursorRowIdSchema = z.uuid();

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
      if (!cursorRowIdSchema.safeParse(id).success) {
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

/** Inside a position cursor, the time and the id that break a tie, around one separator. */
const POSITION_SEPARATOR = '~';

/**
 * The cursor of a list whose rows can move up while somebody scrolls it (ADR 0082): opaque to a
 * client as every cursor is, it is the base64url of the place the last row sat when it was sent,
 * its time and its id, rather than the id alone. Looking that row up again would find where it is
 * now, and a page read from there could repeat rows already sent. One that does not decode to a
 * place is refused as an invalid request.
 */
export const positionCursorQueryShape = {
  ...cursorQueryShape,
  cursor: z
    .string()
    .optional()
    .transform((cursor, context) => {
      if (cursor === undefined) {
        return null;
      }
      const [at = '', id = '', ...rest] = Buffer.from(cursor, 'base64url')
        .toString('utf8')
        .split(POSITION_SEPARATOR);
      if (
        rest.length > 0 ||
        !z.iso.datetime().safeParse(at).success ||
        !cursorRowIdSchema.safeParse(id).success
      ) {
        context.addIssue({ code: 'custom', message: 'Not a cursor.' });
        return z.NEVER;
      }
      return { createdAt: new Date(at), id };
    }),
};

/**
 * The paging field a cursor-paged response carries beside its `items`; `null` on the last page.
 * Described by hand, because a nullable string on a response root otherwise comes out of the
 * contract as an array of strings (`docs/design/0016` §10).
 */
export const cursorResultShape = {
  nextCursor: z.string().nullable().meta({ type: 'string', nullable: true }),
};

/** The opaque cursor for the page after the row with this id, or `null` when there is none. */
export function toCursor(afterId: string | null): string | null {
  return afterId === null ? null : Buffer.from(afterId).toString('base64url');
}

/** The opaque cursor for the page after this place, or `null` when there is none (ADR 0082). */
export function toPositionCursor(
  after: { readonly createdAt: Date; readonly id: string } | null,
): string | null {
  return after === null
    ? null
    : Buffer.from(
        `${after.createdAt.toISOString()}${POSITION_SEPARATOR}${after.id}`,
      ).toString('base64url');
}
