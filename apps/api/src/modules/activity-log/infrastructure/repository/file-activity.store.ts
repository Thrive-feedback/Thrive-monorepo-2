import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { StorageConfig } from '@app/config/configuration';
import { mutateJsonFile } from '@app/infrastructure/json-file.store';
import { ActivityStore } from '../../application/port/activity-store.port';
import type { ActivityEntry } from '../../application/types/activity-entry.types';
import { ACTIVITY_LOG_FILE, type ActivityEntryRecord } from '../entity/activity-entry.record';

/** BE_02 R6 / BE_06 R5 — the outward end of {@link ActivityStore}. */
@Injectable()
export class FileActivityStore extends ActivityStore {
  constructor(private readonly storage: StorageConfig) {
    super();
  }

  async appendAll(entries: readonly ActivityEntry[]): Promise<void> {
    const records: ActivityEntryRecord[] = entries.map((entry) => ({ ...entry }));

    // BE_05 R8 — one serialized read-modify-write; concurrent appends cannot clobber.
    await mutateJsonFile<ActivityEntryRecord[]>(join(this.storage.dataDir, ACTIVITY_LOG_FILE), (current) => [
      ...(current ?? []),
      ...records,
    ]);
  }
}
