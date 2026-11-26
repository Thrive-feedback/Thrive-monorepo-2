import {
  OneOnOneAlreadyOverError,
  OneOnOneAnswerNoteTooLongError,
  OneOnOneInviteNoteTooLongError,
  OneOnOneNotAwaitingAnswerError,
  OneOnOneNotInItError,
  OneOnOneNotRunningError,
  OneOnOneNotYoursToAnswerError,
  OneOnOneNotYoursToChangeError,
  OneOnOneNotYoursToWithdrawError,
  OneOnOneTimePassedError,
  OneOnOneWithYourselfError,
} from '../one-on-one.errors';
import {
  OneOnOneSchedule,
  type OneOnOneScheduleSnapshot,
} from '../value-object/one-on-one-schedule.vo';
import {
  OneOnOneStatus,
  type OneOnOneStatusValue,
} from '../value-object/one-on-one-status.vo';

/** How long a note sent with an invitation, or written turning one down, may be. */
const MAX_NOTE_LENGTH = 280;

/** A note as written, trimmed; blank is no note. */
function noteOf(raw: string | null): string | null {
  return raw?.trim() || null;
}

export interface OneOnOneSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly startedByAccountId: string;
  readonly invitedAccountId: string;
  readonly status: OneOnOneStatusValue;
  readonly schedule: OneOnOneScheduleSnapshot;
  readonly inviteNote: string | null;
  /** When the person invited last sent it back with another time; `null` if they never did. */
  readonly suggestedAt: Date | null;
  readonly answerNote: string | null;
  readonly answeredAt: Date | null;
  readonly endedAt: Date | null;
}

/**
 * Whether a 1:1 in this status, on this schedule, may open a new meeting at `at`: while it runs and
 * still has one to come. A one-time 1:1 opens its one meeting before its slot has passed, and none
 * once that meeting is finished. A read asks this too, so it never offers an agenda that cannot open.
 */
export function mayOpenMeeting(
  status: OneOnOneStatus,
  schedule: OneOnOneSchedule,
  at: Date,
  hasFinishedMeeting: boolean,
): boolean {
  return (
    status.isRunning() &&
    !schedule.isOverAt(at) &&
    !(schedule.isOnce() && hasFinishedMeeting)
  );
}

/**
 * Whether a meeting of a 1:1 in this status, on this schedule, may still be written to at `at`:
 * while the 1:1 runs. A meeting started stays writable until it is finished, though a one-time
 * slot has passed; an agenda never started is not, once that slot has passed, as the 1:1 then
 * reads as met.
 */
export function meetingWritable(
  status: OneOnOneStatus,
  schedule: OneOnOneSchedule,
  isStarted: boolean,
  at: Date,
): boolean {
  return status.isRunning() && (isStarted || !schedule.isOverAt(at));
}

/**
 * A 1:1 between two Members of one Workspace (brain ADR-0060 and ADR-0061, proposed), recurring or
 * held just once. One of them invites the other, with when it meets and, if they like, a note;
 * nothing reaches anybody's week until the person invited accepts. They may instead send it back with
 * another time, and then it waits on the first. Once accepted the two are equal: either can change
 * when it meets, and either can end it. Before it is answered, the invitation is its sender's to
 * change or withdraw.
 *
 * Who may answer, change or end it is a rule over this one 1:1, so it lives here (BE_21 R7); whether
 * the caller is in the Workspace at all is the use case's.
 */
export class OneOnOne {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private startedByAccountId: string,
    private invitedAccountId: string,
    private status: OneOnOneStatus,
    private schedule: OneOnOneSchedule,
    private inviteNote: string | null,
    private suggestedAt: Date | null,
    private answerNote: string | null,
    private answeredAt: Date | null,
    private endedAt: Date | null,
  ) {}

  /** Somebody invites a teammate to a 1:1, saying when it meets; the teammate is asked to accept. */
  static invite(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly startedByAccountId: string;
    readonly invitedAccountId: string;
    readonly schedule: OneOnOneSchedule;
    readonly note: string | null;
  }): OneOnOne {
    if (details.startedByAccountId === details.invitedAccountId) {
      throw new OneOnOneWithYourselfError();
    }
    const note = noteOf(details.note);
    if (note !== null && note.length > MAX_NOTE_LENGTH) {
      throw new OneOnOneInviteNoteTooLongError(MAX_NOTE_LENGTH);
    }
    return new OneOnOne(
      details.id,
      details.workspaceId,
      details.startedByAccountId,
      details.invitedAccountId,
      OneOnOneStatus.Invited,
      details.schedule,
      note,
      null,
      null,
      null,
      null,
    );
  }

  /** Rebuilds one already stored; only the repository calls this. */
  static restore(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly startedByAccountId: string;
    readonly invitedAccountId: string;
    readonly status: OneOnOneStatus;
    readonly schedule: OneOnOneSchedule;
    readonly inviteNote: string | null;
    readonly suggestedAt: Date | null;
    readonly answerNote: string | null;
    readonly answeredAt: Date | null;
    readonly endedAt: Date | null;
  }): OneOnOne {
    return new OneOnOne(
      details.id,
      details.workspaceId,
      details.startedByAccountId,
      details.invitedAccountId,
      details.status,
      details.schedule,
      details.inviteNote,
      details.suggestedAt,
      details.answerNote,
      details.answeredAt,
      details.endedAt,
    );
  }

  /** Whether somebody is one of its two people. */
  isIn(accountId: string): boolean {
    return (
      accountId === this.startedByAccountId ||
      accountId === this.invitedAccountId
    );
  }

  /**
   * Whether it still holds the two to something: an invitation not yet answered, or a running 1:1,
   * unless it is a one-time meeting whose time is over. An invitation to a one-time meeting that has
   * passed can no longer be accepted, so it holds nobody. A one-time 1:1 whose meeting was started
   * and is not finished still holds the two, though its slot has passed. Two people keep one open
   * 1:1 at a time.
   */
  isOpenAt(at: Date, hasMeetingInProgress = false): boolean {
    if (this.status.isRunning() && hasMeetingInProgress) {
      return true;
    }
    return (
      (this.status.isAwaitingAnswer() || this.status.isRunning()) &&
      !this.schedule.isOverAt(at)
    );
  }

  /**
   * Its meetings are written while it runs. A meeting already open stays writable after a one-time
   * 1:1's slot has passed, so a talk that runs over can still be noted and finished.
   */
  assertMeetingsWritable(): void {
    if (!this.status.isRunning()) {
      throw new OneOnOneNotRunningError();
    }
  }

  /**
   * One of its meetings is written to, started or finished while the 1:1 runs. A one-time 1:1's
   * agenda left unstarted until its slot has passed is neither changed nor started after it, as the
   * 1:1 then reads as met; a meeting started goes on until it is finished.
   */
  assertMayWriteMeeting(isStarted: boolean, at: Date): void {
    this.assertMeetingsWritable();
    if (!meetingWritable(this.status, this.schedule, isStarted, at)) {
      throw new OneOnOneNotRunningError();
    }
  }

  /**
   * A new meeting opens while it runs and still has one to come: a one-time 1:1 opens its one
   * meeting before its slot has passed, and none after it was finished.
   */
  assertMayOpenMeeting(at: Date, hasFinishedMeeting: boolean): void {
    this.assertMeetingsWritable();
    if (!mayOpenMeeting(this.status, this.schedule, at, hasFinishedMeeting)) {
      throw new OneOnOneNotRunningError();
    }
  }

  /** The person invited agrees, to the schedule they were sent, while that is still to come. */
  accept(byAccountId: string, at: Date): void {
    if (byAccountId !== this.invitedAccountId) {
      throw new OneOnOneNotYoursToAnswerError();
    }
    const next = this.status.accept();
    if (this.schedule.isOverAt(at)) {
      throw new OneOnOneTimePassedError();
    }
    this.status = next;
    this.answeredAt = at;
  }

  /**
   * The person invited sends it back with another time, and a note if they like. It stays one
   * invitation, now waiting on whoever sent it first, who may accept, decline or send it back again.
   */
  suggestAnother(
    byAccountId: string,
    schedule: OneOnOneSchedule,
    note: string | null,
    at: Date,
  ): void {
    if (byAccountId !== this.invitedAccountId) {
      throw new OneOnOneNotYoursToAnswerError();
    }
    if (!this.status.isAwaitingAnswer()) {
      throw new OneOnOneNotAwaitingAnswerError();
    }
    this.assertInvitationNotPassed(at);
    const written = noteOf(note);
    if (written !== null && written.length > MAX_NOTE_LENGTH) {
      throw new OneOnOneInviteNoteTooLongError(MAX_NOTE_LENGTH);
    }
    this.invitedAccountId = this.startedByAccountId;
    this.startedByAccountId = byAccountId;
    this.schedule = schedule;
    this.inviteNote = written;
    this.suggestedAt = at;
  }

  /**
   * The person invited turns it down, saying why if they want to. Nothing is kept for either person,
   * and whoever sent the invitation reads the note.
   */
  decline(byAccountId: string, at: Date, note: string | null): void {
    if (byAccountId !== this.invitedAccountId) {
      throw new OneOnOneNotYoursToAnswerError();
    }
    const written = noteOf(note);
    if (written !== null && written.length > MAX_NOTE_LENGTH) {
      throw new OneOnOneAnswerNoteTooLongError(MAX_NOTE_LENGTH);
    }
    this.status = this.status.decline();
    this.answerNote = written;
    this.answeredAt = at;
  }

  /**
   * Either person ends a running 1:1, with no approval from the other; before it is answered, only
   * whoever sent the invitation can withdraw it. What was written in it stays readable to both.
   */
  end(byAccountId: string, at: Date): void {
    if (!this.isIn(byAccountId)) {
      throw new OneOnOneNotInItError();
    }
    if (
      this.status.isAwaitingAnswer() &&
      byAccountId !== this.startedByAccountId
    ) {
      throw new OneOnOneNotYoursToWithdrawError();
    }
    if (this.status.isRunning() && this.schedule.isOverAt(at)) {
      throw new OneOnOneAlreadyOverError();
    }
    this.status = this.status.end();
    this.endedAt = at;
  }

  /**
   * Either person changes when a running 1:1 meets, and it holds at once. Before it is answered, only
   * the sender changes what the invitation says.
   */
  reschedule(byAccountId: string, schedule: OneOnOneSchedule, at: Date): void {
    if (!this.isIn(byAccountId)) {
      throw new OneOnOneNotInItError();
    }
    if (
      this.status.isAwaitingAnswer() &&
      byAccountId !== this.startedByAccountId
    ) {
      throw new OneOnOneNotYoursToChangeError();
    }
    this.status.assertSchedulable();
    if (this.status.isRunning() && this.schedule.isOverAt(at)) {
      throw new OneOnOneNotRunningError();
    }
    this.assertInvitationNotPassed(at);
    this.schedule = schedule;
  }

  /**
   * An invitation to a one-time meeting whose time has passed holds nobody, so the two may invite
   * each other again. It is not brought back by a new time: it can only be declined or withdrawn,
   * or there would be two open 1:1s between the same people.
   */
  private assertInvitationNotPassed(at: Date): void {
    if (this.status.isAwaitingAnswer() && this.schedule.isOverAt(at)) {
      throw new OneOnOneTimePassedError();
    }
  }

  snapshot(): OneOnOneSnapshot {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      startedByAccountId: this.startedByAccountId,
      invitedAccountId: this.invitedAccountId,
      status: this.status.toString(),
      schedule: this.schedule.snapshot(),
      inviteNote: this.inviteNote,
      suggestedAt: this.suggestedAt,
      answerNote: this.answerNote,
      answeredAt: this.answeredAt,
      endedAt: this.endedAt,
    };
  }
}
