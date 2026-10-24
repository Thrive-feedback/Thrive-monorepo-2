import { ApplicationError } from '@app/shared/errors/coded-error';

/**
 * The value carrying the link through the chat tool and back was missing, not signed by Thrive,
 * expired, or was issued for another Account or another tool.
 *
 * It is the one thing standing between a Member and a crafted link that attaches **somebody
 * else's** chat account to their Thrive Account — after which every direct message meant for
 * them arrives somewhere else, silently and indefinitely. So a mismatch ends the link rather
 * than correcting it.
 */
export class LinkStateInvalidError extends ApplicationError {
  readonly code = 'LINK_STATE_INVALID';
  readonly category = 'validation' as const;

  constructor() {
    super('This link did not start here, or it has taken too long.');
  }
}

/** The chat tool refused to say who authorised, so there is nobody to link. */
export class LinkRefusedError extends ApplicationError {
  readonly code = 'LINK_REFUSED';
  readonly category = 'conflict' as const;

  constructor() {
    super('The chat tool refused to say which account this is.');
  }
}

/**
 * That chat account is already linked to a different Thrive Account. Refused rather than moved:
 * a notification stream has one reader, and silently taking somebody else's would be the way to
 * read their Feedback notifications (design 0021 D8).
 */
export class AccountAlreadyLinkedError extends ApplicationError {
  readonly code = 'ACCOUNT_ALREADY_LINKED';
  readonly category = 'conflict' as const;

  constructor() {
    super('That chat account is already linked to another Thrive Account.');
  }
}

/**
 * There is no link to that chat tool to remove. Said plainly rather than answered as a success:
 * somebody who pressed Unlink twice is told what is so instead of being left to wonder.
 */
export class NotLinkedError extends ApplicationError {
  readonly code = 'NOT_LINKED';
  readonly category = 'not_found' as const;

  constructor() {
    super('You have not linked an account in that chat tool.');
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

/**
 * There is no Notification of the caller's with that id here — because there never was one, or
 * because it is somebody else's.
 *
 * The two are deliberately one answer. Telling them apart would let anyone walk a list of ids
 * and learn which of them name a Notification a teammate was sent, which is the whole of what a
 * Notification reveals: that a named person was asked, answered or written to.
 */
export class NotificationNotFoundError extends ApplicationError {
  readonly code = 'NOTIFICATION_NOT_FOUND';
  readonly category = 'not_found' as const;

  constructor() {
    super('You have no notification with this id in this Workspace.');
  }
}
