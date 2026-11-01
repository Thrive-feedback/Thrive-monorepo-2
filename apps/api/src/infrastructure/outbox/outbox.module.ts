import { Outbox } from '@app/shared/application/outbox.port';
import { OutboxHandlerRegistry } from '@app/shared/application/outbox-handler.port';
import {
  type DynamicModule,
  type FactoryProvider,
  Module,
} from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import {
  KeyedOutboxHandlerRegistry,
  OUTBOX_HANDLERS,
  type RegisteredOutboxHandler,
} from './keyed-outbox-handler.registry';
import {
  OUTBOX_POLL_INTERVAL_MS,
  OutboxRelay,
  POLL_INTERVAL_MS,
} from './outbox-relay.service';
import { PrismaOutbox } from './prisma-outbox.adapter';

@Module({})
export class OutboxModule {}

/**
 * How the composition root names its handlers: the modules they live in, and a provider that
 * builds the list.
 *
 * `handlers` is Nest's own factory provider less its token, so the argument types belong to the
 * caller's factory and this file needs no `any` of its own (`GEN_07` R4).
 */
export interface OutboxHandlerWiring {
  /** The modules whose handlers the factory injects. */
  readonly imports?: DynamicModule['imports'];
  readonly handlers?: Omit<
    FactoryProvider<readonly RegisteredOutboxHandler[]>,
    'provide'
  >;
}

/**
 * The outbox belongs to no bounded context, so it sits outside `modules/` (ADR 0076): a relay
 * under `modules/` would have to import its consumers while they import its port, and
 * `tsPreCompilationDeps` makes even a type-only import a cycle.
 *
 * The composition root names the handlers, which is what keeps that cycle from forming — the
 * relay never imports a module and no module imports the relay. A **factory** rather than a list
 * of instances, because a handler is a provider with its own dependencies and only the container
 * can build one.
 *
 * A function rather than a static method on the module, because a class whose only member is
 * static is one the lint rules refuse.
 */
export function outboxModule(wiring: OutboxHandlerWiring = {}): DynamicModule {
  return {
    module: OutboxModule,
    // Global for the same reason `SharedModule` is: `Outbox` belongs to no capability, so a
    // module declares a dependency on the *contract* rather than on this module. Three use
    // cases in Feedback need it today and more will; importing a dynamic module into each is
    // wiring nobody would keep right.
    global: true,
    imports: [DatabaseModule, ...(wiring.imports ?? [])],
    providers: [
      { provide: Outbox, useClass: PrismaOutbox },
      {
        provide: OUTBOX_HANDLERS,
        useFactory: wiring.handlers?.useFactory ?? (() => []),
        inject: wiring.handlers?.inject ?? [],
      },
      { provide: OutboxHandlerRegistry, useClass: KeyedOutboxHandlerRegistry },
      { provide: OUTBOX_POLL_INTERVAL_MS, useValue: POLL_INTERVAL_MS },
      OutboxRelay,
    ],
    exports: [Outbox, OutboxRelay],
  };
}
