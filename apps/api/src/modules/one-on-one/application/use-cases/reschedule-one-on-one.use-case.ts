import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneRepository } from '../../domain/repository/one-on-one-repository.port';
import { OneOnOneSchedule } from '../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneNotFoundError } from '../one-on-one.errors';
import { oneOnOneKey } from '../service/one-on-one-keys.service';
import type { OneOnOneScheduleInput } from '../types/one-on-one.types';

export interface RescheduleOneOnOneInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly schedule: OneOnOneScheduleInput;
}

/**
 * Either person in a running 1:1 changes when it meets, or the template its agenda starts from, and
 * it holds at once; before it is answered, the sender changes what the invitation says. Its next
 * meeting is the first under the new schedule from now.
 */
@Injectable()
export class RescheduleOneOnOneUseCase {
  constructor(
    private readonly oneOnOneRepository: OneOnOneRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: RescheduleOneOnOneInput): Promise<void> {
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
        oneOnOne.reschedule(input.accountId, schedule, now);
        await this.oneOnOneRepository.save(oneOnOne);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
