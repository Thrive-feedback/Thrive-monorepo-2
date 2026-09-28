import { Module } from '@nestjs/common';
import { ActivityStore } from './application/port/activity-store.port';
import { ActivityQuery } from './application/query-port/activity.query-port';
import { ReadActivityPort } from './domain/port/read-activity.port';
import { ReadActivityAdapter } from './application/adapter/read-activity.adapter';
import { ReadActivityUseCase } from './application/use-cases/read-activity.use-case';
import { RecordActivityPort } from './domain/port/record-activity.port';
import { RecordActivityAdapter } from './application/adapter/record-activity.adapter';
import { RecordActivityUseCase } from './application/use-cases/record-activity.use-case';
import { FileActivityQuery } from './infrastructure/query/file-activity.query';
import { FileActivityStore } from './infrastructure/repository/file-activity.store';

/**
 * BE_02 R8 — every contract is bound to its implementation here and nowhere else.
 * BE_03 R2 — only the published ports are exported; `ActivityStore` stays internal.
 */
@Module({
  providers: [
    { provide: ActivityStore, useClass: FileActivityStore },
    { provide: ActivityQuery, useClass: FileActivityQuery },
    RecordActivityUseCase,
    ReadActivityUseCase,
    { provide: RecordActivityPort, useClass: RecordActivityAdapter },
    { provide: ReadActivityPort, useClass: ReadActivityAdapter },
  ],
  exports: [RecordActivityPort, ReadActivityPort],
})
export class ActivityLogModule {}
