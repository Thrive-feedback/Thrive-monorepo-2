import { Injectable } from '@nestjs/common';
import type { OneOnOneMeetingsSoFar } from '../../domain/entity/one-on-one.entity';
import { OneOnOneMeetingQuery } from '../query-port/one-on-one-meeting.query-port';

/**
 * What a 1:1's meetings say before its schedule changes or ends: the days those held counted for,
 * and whether one is under way. The 1:1 keeps the days skipped from it, which a new schedule could
 * no longer work out.
 */
@Injectable()
export class OneOnOneMeetingsSoFarService {
  constructor(private readonly meetingQuery: OneOnOneMeetingQuery) {}

  async of(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOneMeetingsSoFar> {
    const [heldFor, live] = await Promise.all([
      this.meetingQuery.listHeldFor(workspaceId, oneOnOneId),
      this.meetingQuery.findLive(workspaceId, oneOnOneId),
    ]);
    return { heldFor, hasMeetingInProgress: live?.startedAt != null };
  }
}
