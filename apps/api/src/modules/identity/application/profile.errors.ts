import { ApplicationError } from '@app/shared/errors/coded-error';

/** An Account introduces itself once; changing a Profile afterwards is a separate action. */
export class ProfileAlreadyExistsError extends ApplicationError {
  readonly code = 'PROFILE_ALREADY_EXISTS';
  readonly category = 'conflict' as const;

  constructor() {
    super('This Account already has a Profile.');
  }
}

/**
 * Another Profile took the slug between choosing it and saving. Creating a Profile retries
 * with the next free slug, so a caller only sees this when that keeps happening.
 */
export class ProfileSlugTakenError extends ApplicationError {
  readonly code = 'PROFILE_SLUG_TAKEN';
  readonly category = 'conflict' as const;

  constructor() {
    super('Another Profile took this slug first. Try again.');
  }
}
