import { ApplicationError } from '@app/shared/errors/coded-error';

/**
 * A Feedback Request only ever reaches people in the Requester's own Workspace. Checked here
 * rather than trusted from the request body, which is where a client could name anybody.
 */
export class GiverNotInWorkspaceError extends ApplicationError {
  readonly code = 'GIVER_NOT_IN_WORKSPACE';
  readonly category = 'validation' as const;

  constructor() {
    super('One of the Members asked is not in this Workspace.');
  }
}

/**
 * No Feedback Request with this id belongs to the Workspace in the path. One answer for both
 * "it does not exist" and "it is someone else's", so no id can be probed for.
 */
export class FeedbackRequestNotFoundError extends ApplicationError {
  readonly code = 'FEEDBACK_REQUEST_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('No Feedback Request with this id exists in this Workspace.');
  }
}

/**
 * The caller is not a Member of the Workspace in the path — the same answer Workspace gives,
 * under the same code, so the two are indistinguishable to a caller. Declared here rather than
 * imported: Workspace publishes whether somebody is a Member, not the code that refuses them.
 */
export class WorkspaceNotFoundError extends ApplicationError {
  readonly code = 'WORKSPACE_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('No Workspace with this id has the caller as a Member.');
  }
}
