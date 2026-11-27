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
    if (!OneOnOneStatus.of(row.status).isRunning()) {
      return {
        ...row,
        withAccountId,
        nextMeetingAt: null,
        nextMeetingSkippedAt: null,
      };
    }
    // A meeting started counts for its own day, late or early; it is never skipped.
    if (row.meetingInProgress) {
      return {
        ...row,
        withAccountId,
        nextMeetingAt: row.meetingInProgressFor,
        nextMeetingSkippedAt: null,
      };
    }
    const schedule = OneOnOneSchedule.restore(row.schedule);
    const due = schedule.dueAt(now, row.lastHeldFor);
    return {
      ...row,
      withAccountId,
      nextMeetingAt: due,
      nextMeetingSkippedAt: due === null ? null : schedule.skippedAt(due),
    };
  }
}
