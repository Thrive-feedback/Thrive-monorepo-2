import type {
  OneOnOneMeetingCursorPageRequest,
  OneOnOneMeetingProjection,
} from '../types/one-on-one-meeting.types';

export abstract class OneOnOneMeetingQuery {
  /** The meeting of one 1:1 that is not finished, or `null` when none is open. */
  abstract findLive(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeetingProjection | null>;

  /** The meeting of one 1:1 finished last, or `null` before the first is finished. */
  abstract findLastFinished(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeetingProjection | null>;

  /** The days the finished meetings of one 1:1 counted for, in no order. */
  abstract listHeldFor(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<readonly Date[]>;

  /** The finished meetings of one 1:1, newest first. */
  abstract listFinished(
    workspaceId: string,
    oneOnOneId: string,
    page: OneOnOneMeetingCursorPageRequest,
  ): Promise<{
    readonly items: readonly OneOnOneMeetingProjection[];
    readonly nextAfterId: string | null;
  }>;
}
