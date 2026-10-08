import { ApplicationError } from '@app/shared/errors/coded-error';

/** A Workspace shows its Owner to everyone in it, so the founder introduces themselves first. */
export class ProfileRequiredError extends ApplicationError {
  readonly code = 'PROFILE_REQUIRED';
  readonly category = 'conflict' as const;

  constructor() {
    super('Introduce yourself before creating a Workspace.');
  }
}

/**
 * One Workspace per person in this release (ADR-0020). Held here rather than in the
 * schema, so letting a person belong to several later is deleting this check.
 */
export class AlreadyInAWorkspaceError extends ApplicationError {
  readonly code = 'ALREADY_IN_A_WORKSPACE';
  readonly category = 'conflict' as const;

  constructor() {
    super('This Account is already a Member of a Workspace.');
  }
}
