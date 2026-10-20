import { DomainError } from '@app/shared/errors/coded-error';

export class WorkspaceGoalNameEmptyError extends DomainError {
  readonly code = 'WORKSPACE_GOAL_NAME_EMPTY';
  readonly category = 'validation' as const;

  constructor() {
    super('A Workspace Goal needs a name.');
  }
}

export class WorkspaceGoalNameTooLongError extends DomainError {
  readonly code = 'WORKSPACE_GOAL_NAME_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(`A Workspace Goal's name must be at most ${maxLength} characters.`);
  }
}

/** A hashtag ends at the first space, so a name with one could never be written whole. */
export class WorkspaceGoalNameHasSpacesError extends DomainError {
  readonly code = 'WORKSPACE_GOAL_NAME_HAS_SPACES';
  readonly category = 'validation' as const;

  constructor() {
    super("A Workspace Goal's name cannot contain spaces; use - instead.");
  }
}

/**
 * Punctuation would make it unclear where a hashtag written in a sentence ends — `#ownership,`
 * — so a name holds letters, digits, `-` and `_` only.
 */
export class WorkspaceGoalNameInvalidCharacterError extends DomainError {
  readonly code = 'WORKSPACE_GOAL_NAME_INVALID_CHARACTER';
  readonly category = 'validation' as const;

  constructor() {
    super(
      "A Workspace Goal's name can only contain letters, numbers, - and _.",
    );
  }
}

export class WorkspaceGoalDescriptionTooLongError extends DomainError {
  readonly code = 'WORKSPACE_GOAL_DESCRIPTION_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(
      `A Workspace Goal's description must be at most ${maxLength} characters.`,
    );
  }
}

/** Only a stored value can fail this: nobody sends a status. */
export class WorkspaceGoalStatusInvalidError extends DomainError {
  readonly code = 'WORKSPACE_GOAL_STATUS_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('A Workspace Goal status must be Active or Hidden.');
  }
}

export class WorkspaceGoalAlreadyHiddenError extends DomainError {
  readonly code = 'WORKSPACE_GOAL_ALREADY_HIDDEN';
  readonly category = 'conflict' as const;

  constructor() {
    super('This Workspace Goal is already hidden.');
  }
}

export class WorkspaceGoalAlreadyActiveError extends DomainError {
  readonly code = 'WORKSPACE_GOAL_ALREADY_ACTIVE';
  readonly category = 'conflict' as const;

  constructor() {
    super('This Workspace Goal is already shown.');
  }
}

/**
 * Two Workspace Goals that differ only in letter case would split one hashtag in two, and a
 * hidden name stays taken — the Admin shows that one again instead (`ADR-0036`).
 *
 * Raised by the use case when it can see the name is in use, and by the repository when two
 * requests raced and the unique index refused the loser. Both are the same rule.
 */
export class WorkspaceGoalNameTakenError extends DomainError {
  readonly code = 'WORKSPACE_GOAL_NAME_TAKEN';
  readonly category = 'conflict' as const;

  constructor() {
    super(
      'This Workspace already has a Workspace Goal by that name, shown or hidden.',
    );
  }
}
