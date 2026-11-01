export interface OutboxMessageToSend {
  /**
   * Which handler drains it, as `<owning module>.<event>` — `integrations.feedback_published`.
   * One string is the registry key, the idempotency key's prefix and the log field.
   */
  readonly type: string;
  /**
   * Ids and enums only. Never a Feedback message, a name or an address: this is the one field
   * that could carry something about a person, and a row outlives the request that wrote it.
   */
  readonly payload: Readonly<Record<string, unknown>>;
  /**
   * What makes a second enqueue of the same thing a no-op, as `<type>:<subject id>`. The caller
   * builds it because only the caller can tell two enqueues of one shape apart.
   */
  readonly idempotencyKey: string;
}

/**
 * Records work to be done once the current transaction commits.
 *
 * **Only inside a unit of work.** The row is written through the open transaction, so the thing
 * and the promise to tell somebody about it commit together or not at all — which is the whole of
 * what this is for. Called outside one it rejects, because a row written outside the transaction
 * it belongs to is the bug this exists to prevent.
 *
 * An abstract class rather than an interface because it has to survive compilation as a runtime
 * injection token.
 */
export abstract class Outbox {
  /** A message whose `idempotencyKey` is already recorded is not recorded twice. */
  abstract enqueue(messages: readonly OutboxMessageToSend[]): Promise<void>;
}
