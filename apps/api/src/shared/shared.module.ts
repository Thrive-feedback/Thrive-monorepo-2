import { Global, Module } from '@nestjs/common';
import { Clock } from './application/clock.port';
import { IdGenerator } from './application/id-generator.port';
import { UnitOfWork } from './application/unit-of-work.port';
import { SerialUnitOfWork } from '../infrastructure/serial-unit-of-work.adapter';
import { SystemClock } from '../infrastructure/system-clock.adapter';
import { UuidIdGenerator } from '../infrastructure/uuid-id-generator.adapter';

/**
 * BE_01 R8 — these live in `shared/` because more than one module imports them.
 * BE_02 R8 — the contract is bound to its implementation here and nowhere else.
 */
@Global()
@Module({
  providers: [
    { provide: Clock, useClass: SystemClock },
    { provide: IdGenerator, useClass: UuidIdGenerator },
    { provide: UnitOfWork, useClass: SerialUnitOfWork },
  ],
  exports: [Clock, IdGenerator, UnitOfWork],
})
export class SharedModule {}
