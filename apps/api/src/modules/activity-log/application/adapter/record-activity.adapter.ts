import { Injectable } from '@nestjs/common';
import { RecordActivityPort } from '../../domain/port/record-activity.port';
import type { RecordActivityCommand } from '../../domain/types/activity.types';
import { RecordActivityUseCase } from '../use-cases/record-activity.use-case';

/**
 * BE_03 R5 — the published port, answered by delegating to this module's use case, so
 * another module reaches the workflow without calling a use case of ours directly.
 */
@Injectable()
export class RecordActivityAdapter extends RecordActivityPort {
  constructor(private readonly recordActivity: RecordActivityUseCase) {
    super();
  }

  record(command: RecordActivityCommand): Promise<void> {
    return this.recordActivity.execute([command]);
  }

  recordAll(commands: readonly RecordActivityCommand[]): Promise<void> {
    return this.recordActivity.execute(commands);
  }
}
