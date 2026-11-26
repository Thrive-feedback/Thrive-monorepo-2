import { Injectable } from '@nestjs/common';
import { OneOnOneSchedule } from '../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneStatus } from '../../domain/value-object/one-on-one-status.vo';
import type { OneOnOneRow, OneOnOneView } from '../types/one-on-one.types';

/**
 * Reads a stored 1:1 for one person in it: who it is with, and, for one that runs, when it next
 * meets: a meeting in progress still counts, and a one-time meeting that is over has none. The next meeting is worked out on read from the schedule; nothing is stored
 * per meeting until something is written for it.
 */
@Injectable()
export class OneOnOneViewService {
  /** `null` when the reader is not in it. */
  toView(
    row: OneOnOneRow,
    readerAccountId: string,
    now: Date,
  ): OneOnOneView | null {
    const withAccountId =
      row.startedByAccountId === readerAccountId
        ? row.invitedAccountId
        : row.invitedAccountId === readerAccountId
          ? row.startedByAccountId
          : null;
    if (withAccountId === null) {
      return null;
    }
    const nextMeetingAt = OneOnOneStatus.of(row.status).isRunning()
      ? OneOnOneSchedule.restore(row.schedule).upcomingAt(now)
      : null;
    return { ...row, withAccountId, nextMeetingAt };
  }
}
