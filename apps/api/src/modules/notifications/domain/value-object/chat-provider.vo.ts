import { ProviderNotSupportedError } from '../notifications.errors';

/**
 * The chat tools a Member may link their own account to (glossary: Linked Account). Discord is
 * the first and Slack is next (brain `ADR-0035`); a second value here is what the rest of the
 * module is shaped around, rather than Discord being written into every file.
 *
 * Declared here rather than imported from Integrations: the two modules happen to name the same
 * tools today, and a value object is not a reason for one to depend on the other (`BE_03` R4).
 */
export const CHAT_PROVIDERS = ['DISCORD'] as const;

export type ChatProviderValue = (typeof CHAT_PROVIDERS)[number];

function isProvider(raw: string): raw is ChatProviderValue {
  return (CHAT_PROVIDERS as readonly string[]).includes(raw);
}

export class ChatProvider {
  private constructor(private readonly value: ChatProviderValue) {}

  /** Every provider value entering from outside passes here, path parameters included. */
  static of(raw: string): ChatProvider {
    if (!isProvider(raw)) {
      throw new ProviderNotSupportedError();
    }
    return new ChatProvider(raw);
  }

  toString(): ChatProviderValue {
    return this.value;
  }
}
