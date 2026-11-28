import { ApplicationError } from '@app/shared/errors/coded-error';

/**
 * The Workspace does not exist, or the caller is not a Member of it. The two are one answer,
 * so nobody outside a Workspace can learn that its id is real.
 */
export class WorkspaceNotFoundError extends ApplicationError {
  readonly code = 'WORKSPACE_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('No Workspace with this id has the caller as a Member.');
  }
}

/**
 * No 1:1 with this id is in this Workspace, or the caller is not in it. One answer for both, so
 * nobody learns that a 1:1 between two other people exists.
 */
export class OneOnOneNotFoundError extends ApplicationError {
  readonly code = 'ONE_ON_ONE_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('No 1:1 with this id has the caller in it.');
  }
}

/** The person named for a 1:1 is not an active Member of this Workspace. */
export class OneOnOnePersonNotFoundError extends ApplicationError {
  readonly code = 'ONE_ON_ONE_PERSON_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('That person is not a Member of this Workspace.');
  }
}

/** These two people already have a 1:1 that is not over: running, or waiting on an answer. */
export class OneOnOneAlreadyExistsError extends ApplicationError {
  readonly code = 'ONE_ON_ONE_ALREADY_EXISTS';
  readonly category = 'conflict' as const;

  constructor() {
    super('You already have a 1:1 with this person.');
  }
}

/** No meeting with this id belongs to this 1:1. */
export class OneOnOneMeetingNotFoundError extends ApplicationError {
  readonly code = 'ONE_ON_ONE_MEETING_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('No meeting with this id belongs to this 1:1.');
  }
}

/**
 * No template with this id is in this Workspace for the caller: none at all, another Member's own,
 * or one removed. One answer for each, so nobody learns what another Member keeps.
 */
export class OneOnOneTemplateNotFoundError extends ApplicationError {
  readonly code = 'ONE_ON_ONE_TEMPLATE_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('No template with this id is kept for the caller.');
  }
}

/**
 * A topic brought from Feedback or a Kudos the caller cannot read about the other person. The same
 * answer whether it does not exist or is not theirs to read, so nobody learns what is there.
 */
export class OneOnOneTopicSourceNotFoundError extends ApplicationError {
  readonly code = 'ONE_ON_ONE_TOPIC_SOURCE_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super(
      'No Feedback or Kudos with this id is one you can bring to this 1:1.',
    );
  }
}
