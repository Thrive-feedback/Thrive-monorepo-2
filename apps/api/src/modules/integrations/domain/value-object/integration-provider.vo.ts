import { ProviderNotSupportedError } from '../integrations.errors';

/**
 * The chat tools Thrive connects to (glossary: Integration). Discord is the first and Slack is
 * next (brain `ADR-0035`); a second value here is what the rest of the module is shaped around,
 * rather than Discord being written into every file.
 */
export const INTEGRATION_PROVIDERS = ['DISCORD'] as const;

export type IntegrationProviderValue = (typeof INTEGRATION_PROVIDERS)[number];

function isProvider(raw: string): raw is IntegrationProviderValue {
  return (INTEGRATION_PROVIDERS as readonly string[]).includes(raw);
}

export class IntegrationProvider {
  private constructor(private readonly value: IntegrationProviderValue) {}

  /** Every provider value entering from outside passes here, path parameters included. */
  static of(raw: string): IntegrationProvider {
    if (!isProvider(raw)) {
      throw new ProviderNotSupportedError();
    }
    return new IntegrationProvider(raw);
  }

  toString(): IntegrationProviderValue {
    return this.value;
  }
}
