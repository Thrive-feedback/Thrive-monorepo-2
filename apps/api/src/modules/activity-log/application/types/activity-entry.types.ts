import type { ActivityAction } from '../../domain/types/activity.types';

/** One entry as the application assembles it, before any store sees it. */
export interface ActivityEntry {
  readonly id: string;
  readonly subjectId: string;
  readonly action: ActivityAction;
  readonly detail: string | null;
  /** ISO-8601 UTC instant (GEN_11). */
  readonly occurredAt: string;
}

/** BE_06 R8 — the internal read model the query contract returns. */
export interface ActivityEntryProjection {
  readonly id: string;
  readonly subjectId: string;
  readonly action: ActivityAction;
  readonly detail: string | null;
  readonly occurredAt: string;
}
