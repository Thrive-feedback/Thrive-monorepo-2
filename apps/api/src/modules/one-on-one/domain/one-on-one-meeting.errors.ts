import { DomainError } from '@app/shared/errors/coded-error';

/** Notes and the "discussed" tick come once the meeting has started. */
export class OneOnOneMeetingNotStartedError extends DomainError {
  readonly code = 'ONE_ON_ONE_MEETING_NOT_STARTED';
  readonly category = 'conflict' as const;

  constructor() {
    super('Start the meeting to take notes in it.');
  }
}

/** Starting twice says nothing new. */
export class OneOnOneMeetingAlreadyStartedError extends DomainError {
  readonly code = 'ONE_ON_ONE_MEETING_ALREADY_STARTED';
  readonly category = 'conflict' as const;

  constructor() {
    super('This meeting has already started.');
  }
}

/** A finished meeting is a record both read; nothing more is written to it. */
export class OneOnOneMeetingFinishedError extends DomainError {
  readonly code = 'ONE_ON_ONE_MEETING_FINISHED';
  readonly category = 'conflict' as const;

  constructor() {
    super('This meeting has finished.');
  }
}

/** A topic one person wrote is theirs to take off the agenda. */
export class OneOnOneTopicNotYoursError extends DomainError {
  readonly code = 'ONE_ON_ONE_TOPIC_NOT_YOURS';
  readonly category = 'forbidden' as const;

  constructor() {
    super('Only the person who added this topic can remove it.');
  }
}

/** The other person changed this topic's note after the caller last read it. */
export class OneOnOneTopicChangedError extends DomainError {
  readonly code = 'ONE_ON_ONE_TOPIC_CHANGED';
  readonly category = 'conflict' as const;

  constructor() {
    super('This note changed since you last read it. Sync to see it.');
  }
}

export class OneOnOneTopicNotFoundError extends DomainError {
  readonly code = 'ONE_ON_ONE_TOPIC_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('No topic with this id is on this agenda.');
  }
}

/** A reorder names every topic on the agenda once, and nothing else. */
export class OneOnOneTopicOrderInvalidError extends DomainError {
  readonly code = 'ONE_ON_ONE_TOPIC_ORDER_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('Name every topic on the agenda once to reorder it.');
  }
}

/** Topics are a line, notes a page; neither is blank where something must be said. */
export class OneOnOneMeetingTextInvalidError extends DomainError {
  readonly code = 'ONE_ON_ONE_MEETING_TEXT_INVALID';
  readonly category = 'validation' as const;

  constructor(reason: string) {
    super(reason);
  }
}

/** One piece of Feedback, or one Kudos, is brought onto an agenda once. */
export class OneOnOneTopicAlreadyOnAgendaError extends DomainError {
  readonly code = 'ONE_ON_ONE_TOPIC_ALREADY_ON_AGENDA';
  readonly category = 'conflict' as const;

  constructor() {
    super('This is already on the agenda.');
  }
}

/** A template is used for an agenda once, while any question it asked is still on it (ADR 0099). */
export class OneOnOneTemplateInUseError extends DomainError {
  readonly code = 'ONE_ON_ONE_TEMPLATE_IN_USE';
  readonly category = 'conflict' as const;

  constructor() {
    super('That template is already on the agenda.');
  }
}
