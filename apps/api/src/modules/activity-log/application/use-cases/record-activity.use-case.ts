import { Injectable } from '@nestjs/common';
import { Clock } from '@app/shared/application/clock.port';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { ActivityStore } from '../port/activity-store.port';
import type { RecordActivityCommand } from '../../domain/types/activity.types';

/**
 * BE_05 R1 — one use case, one public method.
 * BE_04 R10 — an activity entry carries no rules, so there is no entity for it.
 *   The record is assembled here and stored; inventing a domain class would add a
 *   layer that enforces nothing.
 */
@Injectable()
export class RecordActivityUseCase {
  constructor(
    private readonly store: ActivityStore,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
  ) {}

  /** Records every command in one write, so a batch costs one round trip (BE_06 R9). */
  async execute(commands: readonly RecordActivityCommand[]): Promise<void> {
    const occurredAt = this.clock.now().toISOString();

    await this.store.appendAll(
      commands.map((command) => ({
        id: this.idGenerator.next(),
        subjectId: command.subjectId,
        action: command.action,
        detail: command.detail ?? null,
        occurredAt,
      })),
    );
  }
}
