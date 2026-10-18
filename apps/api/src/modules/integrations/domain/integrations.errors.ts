import { DomainError } from '@app/shared/errors/coded-error';

/**
 * The chat tool named is not one Thrive connects to. A validation failure rather than a missing
 * route, so "Thrive does not support this tool" and "that address is wrong" stay distinct to a
 * caller.
 */
export class ProviderNotSupportedError extends DomainError {
  readonly code = 'PROVIDER_NOT_SUPPORTED';
  readonly category = 'validation' as const;

  constructor() {
    super('Thrive does not connect to that chat tool.');
  }
}
