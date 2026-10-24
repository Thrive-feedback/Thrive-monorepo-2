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
