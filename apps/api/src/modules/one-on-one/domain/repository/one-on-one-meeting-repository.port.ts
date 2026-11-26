import type { OneOnOneMeeting } from '../entity/one-on-one-meeting.entity';

/** The meetings of 1:1s, with their agendas: stored and read back whole. */
export abstract class OneOnOneMeetingRepository {
  /** `null` when there is none with this id for this 1:1 in this Workspace. */
  abstract findById(
    workspaceId: string,
    oneOnOneId: string,
    meetingId: string,
  ): Promise<OneOnOneMeeting | null>;

  /** The one meeting of this 1:1 that is not finished, preparing or in progress, if any. */
  abstract findLive(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeeting | null>;

  /** The last meeting of this 1:1 that was finished, which the next one carries from. */
  abstract findLastFinished(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeeting | null>;

  /** Stores a new one, or what changed in one, its agenda included. */
  abstract save(meeting: OneOnOneMeeting): Promise<void>;
}
