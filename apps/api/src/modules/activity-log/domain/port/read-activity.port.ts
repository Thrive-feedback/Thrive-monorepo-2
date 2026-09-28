import type { ActivityPageRequest, ActivityPageView } from '../types/activity.types';

/**
 * BE_03 R5/R6 — the read half of this module's public surface. It returns plain
 * data, so the consumer never learns that activity is stored as a JSON file.
 */
export abstract class ReadActivityPort {
  /** Most recent first. An empty page when the subject has no activity (BE_06 R8). */
  abstract pageFor(subjectId: string, request: ActivityPageRequest): Promise<ActivityPageView>;
}
