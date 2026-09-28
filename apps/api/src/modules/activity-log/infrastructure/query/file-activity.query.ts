import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { StorageConfig } from '@app/config/configuration';
import { readJsonFile } from '@app/infrastructure/json-file.store';
import { ActivityQuery } from '../../application/query-port/activity.query-port';
import type { ActivityEntryProjection } from '../../application/types/activity-entry.types';
import { ACTIVITY_LOG_FILE, type ActivityEntryRecord } from '../entity/activity-entry.record';

/** The read side: implements the query contract behind BE_06 R7. */
@Injectable()
export class FileActivityQuery extends ActivityQuery {
  constructor(private readonly storage: StorageConfig) {
    super();
  }

  async pageBySubject(
    subjectId: string,
    { page, pageSize }: { readonly page: number; readonly pageSize: number },
  ): Promise<{ items: ActivityEntryProjection[]; total: number }> {
    const all = (await readJsonFile<ActivityEntryRecord[]>(join(this.storage.dataDir, ACTIVITY_LOG_FILE))) ?? [];
    const matching = all
      .filter((entry) => entry.subjectId === subjectId)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
    const start = (page - 1) * pageSize;

    return {
      items: matching.slice(start, start + pageSize).map((record) => ({
        id: record.id,
        subjectId: record.subjectId,
        action: record.action,
        detail: record.detail,
        occurredAt: record.occurredAt,
      })),
      total: matching.length,
    };
  }
}
