import { DomainError } from '@app/shared/errors/coded-error';

export class FullNameEmptyError extends DomainError {
  readonly code = 'FULL_NAME_EMPTY';
  readonly category = 'validation' as const;

  constructor() {
    super('Full name must contain at least one non-space character.');
  }
}

export class FullNameTooLongError extends DomainError {
  readonly code = 'FULL_NAME_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(`Full name must be at most ${maxLength} characters.`);
  }
}

export class DisplayNameEmptyError extends DomainError {
  readonly code = 'DISPLAY_NAME_EMPTY';
  readonly category = 'validation' as const;

  constructor() {
    super('Display name must contain at least one non-space character.');
  }
}

export class DisplayNameTooLongError extends DomainError {
  readonly code = 'DISPLAY_NAME_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(`Display name must be at most ${maxLength} characters.`);
  }
}

/** Only a stored slug can fail this: a slug made from an email is valid by construction. */
export class ProfileSlugInvalidError extends DomainError {
  readonly code = 'PROFILE_SLUG_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('A Profile slug must be lowercase letters, digits, ".", "-" or "_".');
  }
}
