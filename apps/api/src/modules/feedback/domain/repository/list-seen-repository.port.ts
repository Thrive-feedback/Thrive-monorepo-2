import type { SeenListValue } from '../value-object/seen-list.vo';

/** Which list of whose was opened. The Member is the caller, never a parameter. */
export interface ListOpened {
  readonly workspaceId: string;
  readonly accountId: string;
  readonly list: SeenListValue;
}

export abstract class ListSeenRepository {
  /**
   * Records that the Member opened this list at `seenAt`, replacing the last time. Opening it
   * again is the ordinary case, so it writes over the row rather than refusing.
   */
  abstract markSeen(opened: ListOpened, seenAt: Date): Promise<void>;
}
