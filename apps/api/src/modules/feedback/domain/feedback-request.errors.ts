import { DomainError } from '@app/shared/errors/coded-error';

export class TopicEmptyError extends DomainError {
  readonly code = 'TOPIC_EMPTY';
  readonly category = 'validation' as const;

  constructor() {
    super('A Topic must contain at least one non-space character.');
  }
}

export class TopicTooLongError extends DomainError {
  readonly code = 'TOPIC_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(`A Topic must be at most ${maxLength} characters.`);
  }
}

/** The Requester becomes the Receiver of everything the request collects, so asking yourself collects nothing. */
export class CannotAskYourselfError extends DomainError {
  readonly code = 'CANNOT_ASK_YOURSELF';
  readonly category = 'validation' as const;

  constructor() {
    super('A Requester cannot ask themselves for Feedback.');
  }
}

/** One Ask per Giver: a second one would collect two answers to the same question. */
export class GiverAlreadyAskedError extends DomainError {
  readonly code = 'GIVER_ALREADY_ASKED';
  readonly category = 'validation' as const;

  constructor() {
    super('This Member has already been asked in this Feedback Request.');
  }
}

export class NoGiversToAskError extends DomainError {
  readonly code = 'NO_GIVERS_TO_ASK';
  readonly category = 'validation' as const;

  constructor() {
    super('Name at least one Member to ask for Feedback.');
  }
}

/** Only a stored value can fail this: nobody sends a status or a Visibility. */
export class AskStatusInvalidError extends DomainError {
  readonly code = 'ASK_STATUS_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('An Ask status must be one of the known statuses.');
  }
}

export class VisibilityInvalidError extends DomainError {
  readonly code = 'VISIBILITY_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('A Visibility must be one of the known audiences.');
  }
}
