import {
  type AiAnswer,
  AiCompleter,
  type AiCompletion,
} from '@app/shared/application/ai-completer.port';

/**
 * Thrown by {@link AiNotConfigured}. A caller that reaches a model without one configured has a
 * bug — every feature that asks a model is supposed to check first and do nothing — so this names
 * that, rather than looking like a provider that happened to refuse.
 */
export class AiNotConfiguredError extends Error {
  constructor() {
    super('No model provider is configured, so nothing can be asked of one');
  }
}

/**
 * What {@link AiCompleter} is bound to where no provider is configured (ADR 0085).
 *
 * It exists so that "switched off" is a thing the application *holds* rather than a branch every
 * caller writes. The port still resolves, so no module has to know whether a provider exists;
 * what changes is that asking is a mistake, and this says so loudly and spends nothing.
 */
export class AiNotConfigured extends AiCompleter {
  async complete(_completion: AiCompletion): Promise<AiAnswer> {
    throw new AiNotConfiguredError();
  }
}
