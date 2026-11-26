import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneRepository } from '../../domain/repository/one-on-one-repository.port';
import { OneOnOneSchedule } from '../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneNotFoundError } from '../one-on-one.errors';
import { oneOnOneKey } from '../service/one-on-one-keys.service';
import { OneOnOneTemplateCatalogService } from '../service/one-on-one-template-catalog.service';
import type { OneOnOneScheduleInput } from '../types/one-on-one.types';

export interface SuggestAnotherTimeInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: the person the invitation waits on. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly schedule: OneOnOneScheduleInput;
  /** Why, or what would suit them, if they want to say. */
  readonly note: string | null;
}

/**
 * The person invited to a 1:1 cannot make the time they were sent and sends it back with another,
 * instead of declining. It stays one invitation, now waiting on whoever sent it first (brain
 * ADR-0061, proposed).
 */
@Injectable()
export class SuggestAnotherTimeUseCase {
  constructor(
    private readonly oneOnOneRepository: OneOnOneRepository,
    private readonly templateCatalog: OneOnOneTemplateCatalogService,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: SuggestAnotherTimeInput): Promise<void> {
    const now = this.clock.now();
    const schedule = OneOnOneSchedule.plan(input.schedule, now);
    await this.unitOfWork.run(
      async () => {
        const oneOnOne = await this.oneOnOneRepository.findById(
          input.workspaceId,
          input.oneOnOneId,
        );
        if (!oneOnOne?.isIn(input.accountId)) {
          throw new OneOnOneNotFoundError();
        }
        const keeping = oneOnOne.snapshot().schedule.templateKey;
        oneOnOne.suggestAnother(input.accountId, schedule, input.note, now);
        // After the 1:1's own refusals, so somebody who may not change it is told that first.
        await this.templateCatalog.assertChoosable(
          input.workspaceId,
          input.accountId,
          schedule.snapshot().templateKey,
          keeping,
        );
        await this.oneOnOneRepository.save(oneOnOne);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
