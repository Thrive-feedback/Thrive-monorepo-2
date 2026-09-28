import { describe, expect, it } from '@jest/globals';
import { FixedClock, SequenceIdGenerator, anId } from '@test/support/shared.fakes';
import { ActivityStore } from '../port/activity-store.port';
import type { ActivityEntry } from '../types/activity-entry.types';
import { RecordActivityUseCase } from './record-activity.use-case';

class InMemoryActivityStore extends ActivityStore {
  readonly entries: ActivityEntry[] = [];

  async appendAll(entries: readonly ActivityEntry[]): Promise<void> {
    this.entries.push(...entries);
  }
}

describe('recording activity', () => {
  it('stamps an entry with a new id and the current instant', async () => {
    const store = new InMemoryActivityStore();
    const recordActivity = new RecordActivityUseCase(
      store,
      new FixedClock(new Date('2026-09-28T09:00:00.000Z')),
      new SequenceIdGenerator([anId(1)]),
    );

    await recordActivity.execute([{ subjectId: anId(2), action: 'todo-list.created', detail: 'Groceries' }]);

    expect(store.entries).toEqual([
      {
        id: anId(1),
        subjectId: anId(2),
        action: 'todo-list.created',
        detail: 'Groceries',
        occurredAt: '2026-09-28T09:00:00.000Z',
      },
    ]);
  });
});
