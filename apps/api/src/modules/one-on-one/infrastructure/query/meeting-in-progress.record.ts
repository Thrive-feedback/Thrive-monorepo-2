/**
 * The meetings a 1:1 is read with, in the same query: of those started, the one not finished if
 * there is one, then the last finished. Enough to tell a meeting in progress, the day the last one
 * held counted for (which says which day is due), and whether a one-time 1:1 has met. The 1:1 query
 * and the repository's open-pair check both read it.
 */
export const MEETING_IN_PROGRESS = {
  meetings: {
    where: { startedAt: { not: null } },
    select: { id: true, occursAt: true, finishedAt: true },
    orderBy: { finishedAt: { sort: 'desc', nulls: 'first' } },
    take: 2,
  },
} as const;

/** The started meetings a 1:1 was read with, as `MEETING_IN_PROGRESS` reads them. */
export type StartedMeetings = readonly {
  readonly id: string;
  readonly occursAt: Date | null;
  readonly finishedAt: Date | null;
}[];

/** The meeting started and not finished, if any. */
export function inProgressOf(meetings: StartedMeetings) {
  return meetings.find((meeting) => meeting.finishedAt === null) ?? null;
}

/** The last meeting finished, if any. */
export function lastFinishedOf(meetings: StartedMeetings) {
  return meetings.find((meeting) => meeting.finishedAt !== null) ?? null;
}

/**
 * What a 1:1 is read with for its reader: its meeting in progress, and the name of the kept template
 * it starts from, both in the same query (BE_06 R9). The foreign key means a kept one is always there.
 */
export const ONE_ON_ONE_ROW = {
  ...MEETING_IN_PROGRESS,
  template: { select: { name: true } },
} as const;
