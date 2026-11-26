import { DomainError } from '@app/shared/errors/coded-error';

/** A 1:1 template's name, when to use it, or its questions are not ones Thrive keeps. */
export class OneOnOneTemplateInvalidError extends DomainError {
  readonly code = 'ONE_ON_ONE_TEMPLATE_INVALID';
  readonly category = 'validation' as const;

  constructor(reason: string) {
    super(`That template cannot be kept: ${reason}`);
  }
}

/**
 * Somebody changed or removed a template that is not theirs to change: another Member's own, or
 * the Workspace's while they are not an Admin.
 */
export class OneOnOneTemplateNotYoursError extends DomainError {
  readonly code = 'ONE_ON_ONE_TEMPLATE_NOT_YOURS';
  readonly category = 'forbidden' as const;

  constructor() {
    super(
      "Only an Admin changes the Workspace's templates, and only you change your own.",
    );
  }
}

/** The layer already keeps a template by this name, in any letter case. */
export class OneOnOneTemplateNameTakenError extends DomainError {
  readonly code = 'ONE_ON_ONE_TEMPLATE_NAME_TAKEN';
  readonly category = 'conflict' as const;

  constructor() {
    super('There is already a template by that name here.');
  }
}

/** The layer already keeps as many templates as Thrive allows one layer. */
export class OneOnOneTemplateLimitReachedError extends DomainError {
  readonly code = 'ONE_ON_ONE_TEMPLATE_LIMIT_REACHED';
  readonly category = 'conflict' as const;

  constructor(readonly limit: number) {
    super(`A layer keeps at most ${limit} templates. Remove one first.`);
  }
}
