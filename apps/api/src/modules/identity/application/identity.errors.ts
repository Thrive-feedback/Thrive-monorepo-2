import { ApplicationError } from '@app/shared/errors/coded-error';

export class NotSignedInError extends ApplicationError {
  readonly code = 'NOT_SIGNED_IN';
  readonly category = 'unauthenticated' as const;

  constructor() {
    super('Sign in to do this.');
  }
}
