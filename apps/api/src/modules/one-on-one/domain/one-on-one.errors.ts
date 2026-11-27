import { DomainError } from '@app/shared/errors/coded-error';

/** A 1:1 is between two people; nobody meets themselves. */
export class OneOnOneWithYourselfError extends DomainError {
  readonly code = 'ONE_ON_ONE_WITH_YOURSELF';
  readonly category = 'validation' as const;

  constructor() {
    super('A 1:1 is with somebody else.');
  }
}

/** How often, which day, what time or how long a 1:1 meets is not one Thrive keeps. */
export class OneOnOneScheduleInvalidError extends DomainError {
  readonly code = 'ONE_ON_ONE_SCHEDULE_INVALID';
  readonly category = 'validation' as const;

  constructor(reason: string) {
    super(`That schedule cannot be kept: ${reason}`);
  }
}

/**
 * The template a 1:1's meetings start from is not one the person may choose: none of Thrive's own,
 * and none their Workspace or they themselves keep.
 */
export class OneOnOneTemplateUnknownError extends DomainError {
  readonly code = 'ONE_ON_ONE_TEMPLATE_UNKNOWN';
  readonly category = 'validation' as const;

  constructor() {
    super('There is no 1:1 template by that name.');
  }
}

export class OneOnOneInviteNoteTooLongError extends DomainError {
  readonly code = 'ONE_ON_ONE_INVITE_NOTE_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(
      `What you write with an invitation to a 1:1 is at most ${maxLength} characters.`,
    );
  }
}

export class OneOnOneAnswerNoteTooLongError extends DomainError {
  readonly code = 'ONE_ON_ONE_ANSWER_NOTE_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(
      `What you write when turning down a 1:1 is at most ${maxLength} characters.`,
    );
  }
}

/** Only a stored value can fail this: nobody sends a status. */
export class OneOnOneStatusInvalidError extends DomainError {
  readonly code = 'ONE_ON_ONE_STATUS_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('A 1:1 status must be Invited, Active, Declined or Ended.');
  }
}

/** It was answered already, or withdrawn: there is nothing left to accept or turn down. */
export class OneOnOneNotAwaitingAnswerError extends DomainError {
  readonly code = 'ONE_ON_ONE_NOT_AWAITING_ANSWER';
  readonly category = 'conflict' as const;

  constructor() {
    super('This 1:1 is no longer waiting for an answer.');
  }
}

/** It was turned down or ended already. */
export class OneOnOneAlreadyOverError extends DomainError {
  readonly code = 'ONE_ON_ONE_ALREADY_OVER';
  readonly category = 'conflict' as const;

  constructor() {
    super('This 1:1 is already over.');
  }
}

/** The answer belongs to the person invited; whoever sent the invitation cannot answer it. */
export class OneOnOneNotYoursToAnswerError extends DomainError {
  readonly code = 'ONE_ON_ONE_NOT_YOURS_TO_ANSWER';
  readonly category = 'forbidden' as const;

  constructor() {
    super('Only the person invited to this 1:1 can answer it.');
  }
}

/** Somebody who is not one of its two people. */
export class OneOnOneNotInItError extends DomainError {
  readonly code = 'ONE_ON_ONE_NOT_IN_IT';
  readonly category = 'forbidden' as const;

  constructor() {
    super('Only the two people in this 1:1 can do that.');
  }
}

/**
 * Before it is answered, an invitation is its sender's to change; the person invited accepts or
 * declines what they were sent.
 */
export class OneOnOneNotYoursToChangeError extends DomainError {
  readonly code = 'ONE_ON_ONE_NOT_YOURS_TO_CHANGE';
  readonly category = 'forbidden' as const;

  constructor() {
    super(
      'Only the person who sent this invitation can change it before it is answered.',
    );
  }
}

/** Withdrawing is for whoever sent the invitation; the person invited declines instead. */
export class OneOnOneNotYoursToWithdrawError extends DomainError {
  readonly code = 'ONE_ON_ONE_NOT_YOURS_TO_WITHDRAW';
  readonly category = 'forbidden' as const;

  constructor() {
    super('Only the person who sent this invitation can withdraw it.');
  }
}

/** A meeting held just once is accepted only before it starts. */
export class OneOnOneTimePassedError extends DomainError {
  readonly code = 'ONE_ON_ONE_TIME_PASSED';
  readonly category = 'conflict' as const;

  constructor() {
    super(
      'The time this 1:1 was sent for has passed. Decline or withdraw it, then create a new one.',
    );
  }
}

/** A schedule is changed or ended while a meeting is under way: that meeting is finished first. */
export class OneOnOneMeetingInProgressError extends DomainError {
  readonly code = 'ONE_ON_ONE_MEETING_IN_PROGRESS';
  readonly category = 'conflict' as const;

  constructor() {
    super('A meeting is in progress. Finish it first.');
  }
}

/** A schedule is changed while the 1:1 still runs, or before it is answered. */
export class OneOnOneNotRunningError extends DomainError {
  readonly code = 'ONE_ON_ONE_NOT_RUNNING';
  readonly category = 'conflict' as const;

  constructor() {
    super('This 1:1 is not running.');
  }
}
