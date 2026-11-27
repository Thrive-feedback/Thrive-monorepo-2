import type { OneOnOneScheduleSnapshot } from '../../domain/value-object/one-on-one-schedule.vo';
import type { OneOnOneStatusValue } from '../../domain/value-object/one-on-one-status.vo';

/** One 1:1 as it is stored, for a reader who is in it. */
export interface OneOnOneRow {
  readonly id: string;
  readonly status: OneOnOneStatusValue;
  /** Who sent the invitation. */
  readonly startedByAccountId: string;
  /** Who was invited, and answers it. */
  readonly invitedAccountId: string;
  readonly schedule: OneOnOneScheduleSnapshot;
  /**
   * What the template its agendas start from is called, for both people: Thrive's, the Workspace's,
   * or either person's own, though only its owner sees that one in their list of templates.
   */
  readonly templateName: string;
  /** What the sender wrote with the invitation, if anything. */
  readonly inviteNote: string | null;
  /** When the person invited last sent it back with another time; `null` if they never did. */
  readonly suggestedAt: Date | null;
  /** What the person invited wrote turning it down, if anything. */
  readonly answerNote: string | null;
  readonly answeredAt: Date | null;
  readonly endedAt: Date | null;
  readonly createdAt: Date;
  /**
   * Whether one of its meetings has been started and not finished: the two are meeting now, or
   * left it open. A one-time 1:1 in that state is not yet over, whatever its slot says.
   */
  readonly meetingInProgress: boolean;
  /**
   * Whether one of its meetings has been finished. A one-time 1:1 in that state is met, and has no
   * next meeting, though the day it was set for is still to come.
   */
  readonly hasFinishedMeeting: boolean;
  /** The day the meeting in progress counts for; `null` when none is. */
  readonly meetingInProgressFor: Date | null;
  /** The day the last meeting held counted for, which says which day is due; `null` if none was. */
  readonly lastHeldFor: Date | null;
  /** Days skipped under a schedule since changed or ended, `YYYY-MM-DD`. */
  readonly skippedDays: readonly string[];
}

/** One 1:1 as its reader sees it: who it is with, and when it next meets. */
export interface OneOnOneView extends OneOnOneRow {
  /** The other person in it, whichever of the two sent the invitation. */
  readonly withAccountId: string;
  /**
   * The start of the day the meeting due is on: in the past while it is overdue, today, or to come.
   * The day a meeting in progress counts for. `null` unless it is running and has one due.
   */
  readonly nextMeetingAt: Date | null;
  /** When the meeting due is skipped if nobody starts it; `null` when none is due or one is started. */
  readonly nextMeetingSkippedAt: Date | null;
}

export interface OneOnOneCursorPageRequest {
  /** The id of the last 1:1 already sent, or `null` for the first page. */
  readonly afterId: string | null;
  readonly limit: number;
}

export interface OneOnOneRowPage {
  readonly items: readonly OneOnOneRow[];
  readonly nextAfterId: string | null;
}

export interface OneOnOneViewPage {
  readonly items: readonly OneOnOneView[];
  readonly nextAfterId: string | null;
}

/** What somebody sends to say when a 1:1 meets. */
export interface OneOnOneScheduleInput {
  readonly cadence: string;
  readonly weekday: number;
  readonly templateKey: string;
  /** The day of a meeting held just once, `YYYY-MM-DD`. */
  readonly startsOn?: string;
}
