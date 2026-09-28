import type { ActivityAction } from '../../domain/types/activity.types';

/** The file, under the data directory, that holds every activity entry. */
export const ACTIVITY_LOG_FILE = 'activity-log.json';

/**
 * The stored shape of one activity entry.
 *
 * BE_06 R4 — a persistence record, so it lives with the infrastructure that writes it and
 * never crosses a port. It is separate from `ActivityEntryView` on purpose: the consumer
 * shape and the stored shape are allowed to drift apart.
 */
export interface ActivityEntryRecord {
  readonly id: string;
  readonly subjectId: string;
  readonly action: ActivityAction;
  readonly detail: string | null;
  readonly occurredAt: string;
}
