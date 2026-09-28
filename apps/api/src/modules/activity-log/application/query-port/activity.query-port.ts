import type { ActivityEntryProjection } from '../types/activity-entry.types';

/** BE_06 R7 — the read contract for a subject's activity, most recent first. */
export abstract class ActivityQuery {
  abstract pageBySubject(
    subjectId: string,
    page: { readonly page: number; readonly pageSize: number },
  ): Promise<{ readonly items: ActivityEntryProjection[]; readonly total: number }>;
}
