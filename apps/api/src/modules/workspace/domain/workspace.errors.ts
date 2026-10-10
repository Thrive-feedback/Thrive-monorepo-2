import { DomainError } from '@app/shared/errors/coded-error';

export class WorkspaceNameEmptyError extends DomainError {
  readonly code = 'WORKSPACE_NAME_EMPTY';
  readonly category = 'validation' as const;

  constructor() {
    super('A Workspace name must contain at least one non-space character.');
  }
}

export class WorkspaceNameTooLongError extends DomainError {
  readonly code = 'WORKSPACE_NAME_TOO_LONG';
  readonly category = 'validation' as const;

  constructor(readonly maxLength: number) {
    super(`A Workspace name must be at most ${maxLength} characters.`);
  }
}

/** Only a stored value can fail this: the request schema accepts only the known sizes. */
export class TeamSizeInvalidError extends DomainError {
  readonly code = 'TEAM_SIZE_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super(
      'Team size must be one of the sizes offered when creating a Workspace.',
    );
  }
}

/** Only a stored value can fail this: nobody sends a Role when creating a Workspace. */
export class MemberRoleInvalidError extends DomainError {
  readonly code = 'MEMBER_ROLE_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('A Member role must be one of the known Roles.');
  }
}

export class NoAddressesToInviteError extends DomainError {
  readonly code = 'NO_ADDRESSES_TO_INVITE';
  readonly category = 'validation' as const;

  constructor() {
    super('Name at least one email address to invite.');
  }
}

export class TooManyInvitationsError extends DomainError {
  readonly code = 'TOO_MANY_INVITATIONS';
  readonly category = 'validation' as const;

  constructor(readonly maxCount: number) {
    super(`Invite at most ${maxCount} people at a time.`);
  }
}
