import { DomainError } from '@app/shared/errors/coded-error';

export class RequestMessageEmptyError extends DomainError {
  readonly code = 'REQUEST_MESSAGE_EMPTY';
  readonly category = 'validation' as const;

  constructor() {
    super('A Request message must contain at least one non-space character.');
  }
}

export class RequestMessageTooLongError extends DomainError {
  readonly code = 'REQUEST_MESSAGE_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(`A Request message must be at most ${maxLength} characters.`);
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

/** Only a stored value can fail this: nobody sends a status. */
export class AskStatusInvalidError extends DomainError {
  readonly code = 'ASK_STATUS_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('An Ask status must be one of the known statuses.');
  }
}

/** The request body's schema names the Visibilities it accepts, so a stored value fails this first. */
export class VisibilityInvalidError extends DomainError {
  readonly code = 'VISIBILITY_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('A Visibility must be Only me, Selected people or Everyone.');
  }
}

/** Selected people with nobody selected would be Only me under another name. */
export class NoPeopleSelectedError extends DomainError {
  readonly code = 'NO_PEOPLE_SELECTED';
  readonly category = 'validation' as const;

  constructor() {
    super('Select at least one Member to share it with.');
  }
}

/**
 * People picked alongside Only me or Everyone. Neither reads a list, so keeping one would store
 * a choice the Requester believes they made and nobody honours.
 */
export class PeopleSelectedForAnotherVisibilityError extends DomainError {
  readonly code = 'PEOPLE_SELECTED_FOR_ANOTHER_VISIBILITY';
  readonly category = 'validation' as const;

  constructor() {
    super(
      'Members can only be selected when the Visibility is Selected people.',
    );
  }
}

export class PersonAlreadySelectedError extends DomainError {
  readonly code = 'PERSON_ALREADY_SELECTED';
  readonly category = 'validation' as const;

  constructor() {
    super('This Member has already been selected.');
  }
}

/**
 * Whoever chooses the Visibility always reads the Feedback — a Requester as its Receiver, the
 * Giver of Offered Feedback as its writer — so selecting themselves would mean nothing.
 */
export class CannotSelectYourselfError extends DomainError {
  readonly code = 'CANNOT_SELECT_YOURSELF';
  readonly category = 'validation' as const;

  constructor() {
    super('You cannot select yourself; you already read this Feedback.');
  }
}

export class FeedbackMessageEmptyError extends DomainError {
  readonly code = 'FEEDBACK_MESSAGE_EMPTY';
  readonly category = 'validation' as const;

  constructor() {
    super('A Feedback message must contain at least one non-space character.');
  }
}

export class FeedbackMessageTooLongError extends DomainError {
  readonly code = 'FEEDBACK_MESSAGE_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(`A Feedback message must be at most ${maxLength} characters.`);
  }
}

/** The Giver is never the Receiver: Feedback is for somebody else. */
export class CannotGiveYourselfFeedbackError extends DomainError {
  readonly code = 'CANNOT_GIVE_YOURSELF_FEEDBACK';
  readonly category = 'validation' as const;

  constructor() {
    super('A Giver cannot give Feedback to themselves.');
  }
}

/** Every Receiver always reads Feedback written to them, so none is somebody to select. */
export class CannotSelectTheReceiverError extends DomainError {
  readonly code = 'CANNOT_SELECT_THE_RECEIVER';
  readonly category = 'validation' as const;

  constructor() {
    super('A Receiver already reads this Feedback; select other Members.');
  }
}

/** Feedback is for somebody: Offered Feedback names at least one Receiver. */
export class NoReceiversError extends DomainError {
  readonly code = 'NO_RECEIVERS';
  readonly category = 'validation' as const;

  constructor() {
    super('Name at least one Member to give Feedback to.');
  }
}

/** One Member is one Receiver: named twice, they would be told twice about one piece. */
export class ReceiverAlreadyNamedError extends DomainError {
  readonly code = 'RECEIVER_ALREADY_NAMED';
  readonly category = 'validation' as const;

  constructor() {
    super('This Member is already one of the Receivers.');
  }
}

/**
 * One Ask collects one answer. A second would mean the Receiver reads two answers to one
 * question and the Giver cannot tell which stands — so the first one is final.
 *
 * Raised by the aggregate when it can see the Ask is not Pending, and by the repository when
 * two requests raced and the unique index refused the loser. Both are the same rule.
 */
export class AskAlreadyAnsweredError extends DomainError {
  readonly code = 'ASK_ALREADY_ANSWERED';
  readonly category = 'conflict' as const;

  constructor() {
    super('This Ask has already been answered.');
  }
}

export class KudosMessageEmptyError extends DomainError {
  readonly code = 'KUDOS_MESSAGE_EMPTY';
  readonly category = 'validation' as const;

  constructor() {
    super('A Kudos must contain at least one non-space character.');
  }
}

export class KudosMessageTooLongError extends DomainError {
  readonly code = 'KUDOS_MESSAGE_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(`A Kudos must be at most ${maxLength} characters.`);
  }
}

/**
 * A Kudos is for the teammates it @mentions, so one that names nobody — or only its Giver, or
 * only people outside the Workspace — is for nobody.
 */
export class KudosNeedsARecipientError extends DomainError {
  readonly code = 'KUDOS_NEEDS_A_RECIPIENT';
  readonly category = 'validation' as const;

  constructor() {
    super('A Kudos must @mention at least one other Member of the Workspace.');
  }
}

/**
 * The text mentions somebody its Visibility would leave out. In a Request message or Offered
 * Feedback, naming a Member means they can read it, so the writer chooses a Visibility that lets
 * them in — Everyone, or Selected people with them in it.
 */
export class MentionedPersonLeftOutError extends DomainError {
  readonly code = 'MENTIONED_PERSON_LEFT_OUT';
  readonly category = 'validation' as const;

  constructor() {
    super('Everyone the text mentions must be able to read it.');
  }
}
