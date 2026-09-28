import type { ActivityEntry } from '../types/activity-entry.types';

/**
 * BE_02 R6 — this module's own outward dependency for writes. Internal: it is deliberately
 * not re-exported from the barrel, so no other module can reach it.
 */
export abstract class ActivityStore {
  /** Appends every entry in one write, however many there are (BE_06 R9). */
  abstract appendAll(entries: readonly ActivityEntry[]): Promise<void>;
}
