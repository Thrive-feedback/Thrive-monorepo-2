import type {
  OneOnOneCursorPageRequest,
  OneOnOneRow,
  OneOnOneRowPage,
} from '../types/one-on-one.types';

export abstract class OneOnOneQuery {
  /**
   * The 1:1s one person is in, in the order they were started: running ones, those waiting on an
   * answer and ended ones, either side of them, and the ones they started that were turned down at or
   * after `declinedSince`. Nothing of any other Workspace, or between two other
   * people, is ever answered.
   */
  abstract listFor(
    workspaceId: string,
    accountId: string,
    page: OneOnOneCursorPageRequest,
    declinedSince: Date,
  ): Promise<OneOnOneRowPage>;

  /** One 1:1, in any state, or `null` when the reader is not in it. */
  abstract findFor(
    workspaceId: string,
    oneOnOneId: string,
    accountId: string,
  ): Promise<OneOnOneRow | null>;
}
