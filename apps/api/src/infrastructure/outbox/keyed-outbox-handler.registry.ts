import {
  type OutboxHandler,
  OutboxHandlerRegistry,
} from '@app/shared/application/outbox-handler.port';
import { Inject, Injectable } from '@nestjs/common';

/** What a module registers: the type it claims, and the handler that drains it. */
export interface RegisteredOutboxHandler {
  readonly type: string;
  readonly handler: OutboxHandler;
}

/**
 * The token the composition root provides. An array rather than each module reaching into the
 * registry: the relay must not import a consumer, and a consumer must not import the relay, or
 * the import graph has a cycle that `no-cycles` fails on (ADR 0076).
 */
export const OUTBOX_HANDLERS = Symbol('OUTBOX_HANDLERS');

@Injectable()
export class KeyedOutboxHandlerRegistry extends OutboxHandlerRegistry {
  private readonly byType: ReadonlyMap<string, OutboxHandler>;

  constructor(
    @Inject(OUTBOX_HANDLERS) registered: readonly RegisteredOutboxHandler[],
  ) {
    super();
    const byType = new Map<string, OutboxHandler>();
    for (const { type, handler } of registered) {
      if (byType.has(type)) {
        // Two handlers for one type is a wiring mistake, and it would be silent: one of them
        // would simply never run.
        throw new Error(`Two outbox handlers claim the type ${type}.`);
      }
      byType.set(type, handler);
    }
    this.byType = byType;
  }

  handlerFor(type: string): OutboxHandler | undefined {
    return this.byType.get(type);
  }
}
