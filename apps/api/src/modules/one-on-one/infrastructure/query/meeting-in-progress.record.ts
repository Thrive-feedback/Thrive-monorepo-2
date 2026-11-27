/**
 * The meetings a 1:1 is read with, in the same query: only one started and not finished, if there
 * is one, and how many were finished, as a one-time 1:1 whose meeting is finished is met whatever
 * day it was set for. The 1:1 query and the repository's open-pair check both read it.
 */
export const MEETING_IN_PROGRESS = {
  meetings: {
    where: { startedAt: { not: null }, finishedAt: null },
    select: { id: true },
    take: 1,
  },
  _count: {
    select: { meetings: { where: { finishedAt: { not: null } } } },
  },
} as const;

/**
 * What a 1:1 is read with for its reader: its meeting in progress, and the name of the kept template
 * it starts from, both in the same query (BE_06 R9). The foreign key means a kept one is always there.
 */
export const ONE_ON_ONE_ROW = {
  ...MEETING_IN_PROGRESS,
  template: { select: { name: true } },
} as const;
