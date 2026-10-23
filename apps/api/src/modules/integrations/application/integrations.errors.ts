import { ApplicationError } from '@app/shared/errors/coded-error';

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

/**
 * A Member who is not an Admin tried to connect, change or read the install of a chat tool.
 * Named rather than hidden behind a 404: this caller has already proved they belong in the
 * Workspace, so there is nothing left to keep from them (`BE_21` R3).
 */
export class NotAllowedToManageIntegrationsError extends ApplicationError {
  readonly code = 'NOT_ALLOWED_TO_MANAGE_INTEGRATIONS';
  readonly category = 'forbidden' as const;

  constructor() {
    super('Only an Admin may connect a chat tool to this Workspace.');
  }
}

/**
 * The value carrying the install through the chat tool and back was missing, not signed by
 * Thrive, expired, or was issued for another Account, Workspace or tool.
 *
 * It is the one thing standing between an Admin and a crafted link that connects somebody
 * else's server to their Workspace, so a mismatch ends the install rather than correcting it.
 */
export class InstallStateInvalidError extends ApplicationError {
  readonly code = 'INSTALL_STATE_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('This install did not start here, or it has taken too long.');
  }
}

/** The chat tool refused to say what was authorised, so there is nothing to connect. */
export class InstallRefusedError extends ApplicationError {
  readonly code = 'INSTALL_REFUSED';
  readonly category = 'conflict' as const;

  constructor() {
    super('The chat tool refused this installation.');
  }
}

/**
 * The channel chosen is not one of the text channels the tool offered for the space that was
 * authorised. Checked against that list rather than taken on trust, so an Admin of one
 * Workspace cannot name a channel in another Workspace's server.
 */
export class ChannelNotOfferedError extends ApplicationError {
  readonly code = 'CHANNEL_NOT_OFFERED';
  readonly category = 'validation' as const;

  constructor() {
    super('That channel is not one of the channels offered for this server.');
  }
}

/**
 * There is no Connection to that chat tool to act on. Said plainly rather than answered as a
 * success: an Admin who pressed Disconnect twice, or whose teammate got there first, is told what
 * is so instead of being left to wonder what happened.
 */
export class ConnectionNotFoundError extends ApplicationError {
  readonly code = 'CONNECTION_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('This Workspace is not connected to that chat tool.');
  }
}

/**
 * The test message did not arrive, most often because the bot cannot post in that channel.
 * Nothing is stored in that case, so a Connection that has never worked cannot exist.
 */
export class ChannelUnreachableError extends ApplicationError {
  readonly code = 'CHANNEL_UNREACHABLE';
  readonly category = 'conflict' as const;

  constructor() {
    super('Thrive could not post in that channel, so nothing was connected.');
  }
}
