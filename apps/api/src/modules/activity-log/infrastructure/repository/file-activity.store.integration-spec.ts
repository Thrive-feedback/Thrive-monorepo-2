import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FixedClock, SequenceIdGenerator, anId } from '@test/support/shared.fakes';
import { StorageConfig } from '@app/config/configuration';
import { ReadActivityAdapter } from '../../application/adapter/read-activity.adapter';
import { RecordActivityAdapter } from '../../application/adapter/record-activity.adapter';
import { ReadActivityUseCase } from '../../application/use-cases/read-activity.use-case';
import { RecordActivityUseCase } from '../../application/use-cases/record-activity.use-case';
import type { ReadActivityPort } from '../../domain/port/read-activity.port';
import type { RecordActivityPort } from '../../domain/port/record-activity.port';
import { FileActivityQuery } from '../query/file-activity.query';
import { FileActivityStore } from './file-activity.store';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

/**
 * BE_12 R7 — a contract test for this module's published ports, written from what a
 * consumer expects: todo records activity and later reads it back. It goes through
 * `RecordActivityPort` / `ReadActivityPort` rather than the store, so the test still
 * passes if the storage behind them is replaced.
 */
describe('activity-log published ports', () => {
  const clock = new FixedClock(new Date('2026-09-19T10:00:00.000Z'));
  const firstPage = { page: 1, pageSize: 10 };
  let dataDir: string;
  let record: RecordActivityPort;
  let read: ReadActivityPort;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'activity-'));
    const storage = new StorageConfig(dataDir);
    const store = new FileActivityStore(storage);
    record = new RecordActivityAdapter(
      new RecordActivityUseCase(store, clock, new SequenceIdGenerator([anId(1), anId(2), anId(3)])),
    );
    read = new ReadActivityAdapter(new ReadActivityUseCase(new FileActivityQuery(storage)));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('returns an empty page for a subject with no activity', async () => {
    // BE_06 R8 — an empty page, never a throw.
    expect(await read.pageFor(anId(99), firstPage)).toEqual({ items: [], total: 0 });
  });

  it('reads back what was recorded, as plain data', async () => {
    const subjectId = anId(50);

    await record.record({ subjectId, action: 'todo-list.created', detail: 'Groceries' });
    const { items: entries } = await read.pageFor(subjectId, firstPage);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      id: anId(1),
      subjectId,
      action: 'todo-list.created',
      detail: 'Groceries',
      occurredAt: '2026-09-19T10:00:00.000Z',
    });
  });

  it('defaults a missing detail to null rather than dropping the field', async () => {
    const subjectId = anId(51);

    await record.record({ subjectId, action: 'todo-list.archived' });

    expect((await read.pageFor(subjectId, firstPage)).items[0]?.detail).toBeNull();
  });

  it('keeps the activity of one subject out of another', async () => {
    await record.record({ subjectId: anId(60), action: 'todo-list.created' });
    await record.record({ subjectId: anId(61), action: 'todo-list.created' });

    expect((await read.pageFor(anId(60), firstPage)).items).toHaveLength(1);
  });

  it('pages the activity and reports the total', async () => {
    const subjectId = anId(70);
    await record.record({ subjectId, action: 'todo-item.added' });
    await record.record({ subjectId, action: 'todo-item.completed' });

    const page = await read.pageFor(subjectId, { page: 2, pageSize: 1 });

    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(2);
  });
});
