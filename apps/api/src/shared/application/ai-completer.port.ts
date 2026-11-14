/**
 * What is asked of a model. `answerSchema` is a JSON Schema object the answer is constrained to;
 * it stays a plain object rather than a Zod schema because it travels over the wire, and the
 * caller validates what comes back whatever the endpoint promised (ADR 0077).
 */
export interface AiCompletion {
  readonly system: string;
  readonly prompt: string;
  readonly answerSchema: Readonly<Record<string, unknown>>;
  /**
   * Sized for reasoning plus answer, not for the answer: a provider that ignores the request to
   * think no further emits reasoning tokens first, and a ceiling sized for the answer alone comes
   * back as a success carrying nothing (ADR 0077).
   */
  readonly maxAnswerTokens: number;
  /**
   * How many times to ask, counting the first. The caller sets it because the budget belongs to
   * where the call runs, not to the wire: a composer a person is waiting in can afford the
   * adapter's own retries, while work drained by the outbox is capped at 30 s per run and must
   * leave its retrying to the outbox instead (ADR 0076, ADR 0077).
   */
  readonly maxAttempts?: number;
}

/** Parsed from the answer's content. Its shape is the caller's to validate. */
export interface AiAnswer {
  readonly content: unknown;
}

/**
 * Asks a model a question and returns a well-formed answer or rejects — never a half-answer.
 *
 * It promises nothing about meaning: whether a summary is faithful or a label is right is the
 * calling module's business. Nothing above the module that binds this knows which provider
 * answers, which is what keeps brain `ADR-0051`'s "bound to no provider" true in code.
 *
 * An abstract class rather than an interface because it has to survive compilation as a runtime
 * injection token.
 */
export abstract class AiCompleter {
  abstract complete(completion: AiCompletion): Promise<AiAnswer>;
}

/**
 * Injection token for whether a model provider is configured at all (ADR 0085).
 *
 * **A feature that asks a model reads this first and does nothing when it is false.** Not because
 * asking would fail — it would, loudly — but because a deployment without a provider should spend
 * nothing, enqueue nothing and promise nobody anything, rather than filling an outbox with work
 * that can only die. It is a boolean, not the provider: which endpoint answers stays inside
 * `AiModule`.
 */
export const AI_IS_CONFIGURED = Symbol('AI_IS_CONFIGURED');
