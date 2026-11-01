import { Outbox } from '@app/shared/application/outbox.port';
import { OutboxHandlerRegistry } from '@app/shared/application/outbox-handler.port';
import { type DynamicModule, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import {
  KeyedOutboxHandlerRegistry,
  OUTBOX_HANDLERS,
  type RegisteredOutboxHandler,
} from './keyed-outbox-handler.registry';
import { OutboxRelay } from './outbox-relay.service';
import { PrismaOutbox } from './prisma-outbox.adapter';

@Module({})
export class OutboxModule {}

/**
 * The outbox belongs to no bounded context, so it sits outside `modules/` (ADR 0076): a relay
 * under `modules/` would have to import its consumers while they import its port, and
 * `tsPreCompilationDeps` makes even a type-only import a cycle.
 *
 * Handlers arrive as a list the composition root supplies, which is what keeps that cycle from
 * forming. A function rather than a static method on the module, because a class whose only
 * member is static is one the lint rules refuse.
 */
export function outboxModule(
  handlers: readonly RegisteredOutboxHandler[] = [],
): DynamicModule {
  return {
    module: OutboxModule,
    imports: [DatabaseModule],
    providers: [
      { provide: Outbox, useClass: PrismaOutbox },
      { provide: OUTBOX_HANDLERS, useValue: handlers },
      { provide: OutboxHandlerRegistry, useClass: KeyedOutboxHandlerRegistry },
      OutboxRelay,
    ],
    exports: [Outbox, OutboxRelay],
  };
}
