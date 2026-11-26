/**
 * The meetings a 1:1 is read with, in the same query: only one started and not finished, if there
 * is one. The 1:1 query and the repository's open-pair check both read it.
 */
export const MEETING_IN_PROGRESS = {
  meetings: {
    where: { startedAt: { not: null }, finishedAt: null },
    select: { id: true },
    take: 1,
  },
} as const;
