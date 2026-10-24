import { DomainError } from '@app/shared/errors/coded-error';

/**
 * The chat tool named is not one a Member may link an account in. A validation failure rather
 * than a missing route, so "Thrive does not support this tool" and "that address is wrong" stay
 * distinct to a caller.
 */
export class ProviderNotSupportedError extends DomainError {
  readonly code = 'PROVIDER_NOT_SUPPORTED';
  readonly category = 'validation' as const;

  constructor() {
    super('Thrive does not message people through that chat tool.');
  }
}

/**
 * A stored Notification names a type this release does not know. It can only be a row written by
 * a later release and read back by an older one, so it is refused where it is read rather than
 * drawn as a type the bell has no sentence for.
 */
export class NotificationTypeNotSupportedError extends DomainError {
  readonly code = 'NOTIFICATION_TYPE_NOT_SUPPORTED';
  readonly category = 'validation' as const;

  constructor() {
    super('Thrive does not tell people about that kind of thing.');
  }
}
