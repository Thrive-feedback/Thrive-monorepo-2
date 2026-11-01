export interface OutboxMessageRead {
  readonly id: string;
  readonly type: string;
  /** The shape of `payload`. A breaking change ships as a new `type`, never a new version here. */
  readonly version: number;
  /** Parsed by the handler, which is the only code that knows what its own type carries. */
  readonly payload: unknown;
  /** Counting this attempt. A handler may read it to tell a first try from a last one. */
  readonly attempts: number;
}

/**
 * Thrown by a handler for work that can never succeed — a payload it cannot parse, a subject that
 * no longer exists. The message goes dead at once rather than spending its remaining attempts on
 * an answer that will not change.
 */
export class UnprocessableOutboxMessage extends Error {}

/**
 * Does the work one message names.
 *
 * **Must be idempotent.** Delivery is at least once: a crash between the work succeeding and the
 * row being marked delivered means the handler is asked again, and so does a handler that times
 * out after the far side already acted.
 *
 * Rejecting means *later*. Throwing {@link UnprocessableOutboxMessage} means *never*.
 */
export abstract class OutboxHandler {
  abstract handle(message: OutboxMessageRead): Promise<void>;
  /**
   * How many times this kind of work may be tried, counting the first. Per handler rather than
   * one number for the relay, because at-least-once is a gain for some work and a regression for
   * the rest: a notification row is idempotent and worth retrying, while a chat post cannot be
   * taken back, so retrying it trades "occasionally lost" for "occasionally doubled" (ADR 0076).
   */
  abstract readonly maxAttempts: number;
}

/** Keyed by `type`, assembled once at the composition root so no module imports another's. */
export abstract class OutboxHandlerRegistry {
  /** Undefined for a type nothing claims — the relay sends that message straight to dead. */
  abstract handlerFor(type: string): OutboxHandler | undefined;
}
