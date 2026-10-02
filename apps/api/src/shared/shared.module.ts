import { SystemClock } from '@app/infrastructure/system-clock.adapter';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { Global, Module } from '@nestjs/common';
import { Clock } from './application/clock.port';
import { IdGenerator } from './application/id-generator.port';

/**
 * These contracts belong to no single capability, so they are bound to their
 * implementations once here instead of in every module that needs the time or an id.
 *
 * Global so a module declares a dependency on the contract rather than on this module.
 */
@Global()
@Module({
  providers: [
    { provide: Clock, useClass: SystemClock },
    { provide: IdGenerator, useClass: UuidIdGenerator },
  ],
  exports: [Clock, IdGenerator],
})
export class SharedModule {}
