import {
  Outbox,
  type OutboxMessageToSend,
} from '@app/shared/application/outbox.port';

/**
 * Records what a use case enqueued, so a test can assert the promise was made without a relay,
 * a handler or a chat tool anywhere near it.
 *
 * It does **not** pretend to be transactional: the real adapter refuses to write outside a unit
 * of work, and that rule is proved against Postgres in `outbox.integration.spec.ts` rather than
 * here. What a use-case spec needs is the message, which this holds.
 */
export class FakeOutbox extends Outbox {
  readonly enqueued: OutboxMessageToSend[] = [];
  private rejecting = false;

  /** For proving a use case fails loudly when the promise cannot be recorded. */
  rejectingEverything(): this {
    this.rejecting = true;
    return this;
  }

  async enqueue(messages: readonly OutboxMessageToSend[]): Promise<void> {
    if (this.rejecting) {
      throw new Error('the outbox refused');
    }
    this.enqueued.push(...messages);
  }

  /** Every message of one type, in the order they were enqueued. */
  ofType(type: string): OutboxMessageToSend[] {
    return this.enqueued.filter((message) => message.type === type);
  }
}
