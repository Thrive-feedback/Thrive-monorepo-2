import type { FeedPosition } from '../../application/types/kudos.types';

/**
 * The rows after a place in a list ordered newest first with `id` breaking ties. A `where` and not
 * Prisma's `cursor`, which only knows a row of the table it is reading: Home's place can be a row of
 * the other one (ADR 0077).
 */
export function olderThan(position: FeedPosition | null) {
  return position === null
    ? {}
    : {
        OR: [
          { createdAt: { lt: position.createdAt } },
          { createdAt: position.createdAt, id: { lt: position.id } },
        ],
      };
}
