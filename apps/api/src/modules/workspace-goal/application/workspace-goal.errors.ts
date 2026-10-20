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

/** Only Admins create, hide and show Workspace Goals; every other Member reads them (`ADR-0036`). */
export class NotAllowedToManageWorkspaceGoalsError extends ApplicationError {
  readonly code = 'NOT_ALLOWED_TO_MANAGE_WORKSPACE_GOALS';
  readonly category = 'forbidden' as const;

  constructor() {
    super('Only Admins can add, hide or show Workspace Goals.');
  }
}

/** No Workspace Goal with this id belongs to this Workspace. */
export class WorkspaceGoalNotFoundError extends ApplicationError {
  readonly code = 'WORKSPACE_GOAL_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('No Workspace Goal with this id is in this Workspace.');
  }
}
