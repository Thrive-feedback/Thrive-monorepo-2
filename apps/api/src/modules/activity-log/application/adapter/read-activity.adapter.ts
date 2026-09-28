import { Injectable } from '@nestjs/common';
import { ReadActivityPort } from '../../domain/port/read-activity.port';
import type {
  ActivityPageRequest,
  ActivityPageView,
} from '../../domain/types/activity.types';
import { ReadActivityUseCase } from '../use-cases/read-activity.use-case';

/** BE_03 R5 — the published read port, answered by this module's query use case. */
@Injectable()
export class ReadActivityAdapter extends ReadActivityPort {
  constructor(private readonly readActivity: ReadActivityUseCase) {
    super();
  }

  pageFor(subjectId: string, request: ActivityPageRequest): Promise<ActivityPageView> {
    return this.readActivity.execute({ subjectId, ...request });
  }
}
