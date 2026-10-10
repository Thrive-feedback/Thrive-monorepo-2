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

/** Owner and Admins invite people; a Member with no management rights cannot. */
export class NotAllowedToInviteError extends ApplicationError {
  readonly code = 'NOT_ALLOWED_TO_INVITE';
  readonly category = 'forbidden' as const;

  constructor() {
    super('Only the Owner and Admins can invite people to this Workspace.');
  }
}

/** Pending Invitations are for those who can invite: the Owner and Admins. */
export class NotAllowedToSeeInvitationsError extends ApplicationError {
  readonly code = 'NOT_ALLOWED_TO_SEE_INVITATIONS';
  readonly category = 'forbidden' as const;

  constructor() {
    super("Only the Owner and Admins can see this Workspace's Invitations.");
  }
}

/** No Invitation has this id. Nothing more is said, to someone who may be guessing ids. */
export class InvitationNotFoundError extends ApplicationError {
  readonly code = 'INVITATION_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('No Invitation has this id.');
  }
}

/** Revoking is for those who can invite: the Owner and Admins. */
export class NotAllowedToRevokeInvitationsError extends ApplicationError {
  readonly code = 'NOT_ALLOWED_TO_REVOKE_INVITATIONS';
  readonly category = 'forbidden' as const;

  constructor() {
    super(
      'Only the Owner and Admins can revoke Invitations to this Workspace.',
    );
  }
}
