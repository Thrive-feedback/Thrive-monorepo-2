import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeetingRepository } from '../../domain/repository/one-on-one-meeting-repository.port';
import { OneOnOneRepository } from '../../domain/repository/one-on-one-repository.port';
import { OneOnOneSchedule } from '../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneNotFoundError } from '../one-on-one.errors';
import { oneOnOneKey } from '../service/one-on-one-keys.service';
import { OneOnOneMeetingsSoFarService } from '../service/one-on-one-meetings-so-far.service';
import { OneOnOneTemplateCatalogService } from '../service/one-on-one-template-catalog.service';
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
    private readonly templateCatalog: OneOnOneTemplateCatalogService,
    private readonly meetingsSoFar: OneOnOneMeetingsSoFarService,
    private readonly meetingRepository: OneOnOneMeetingRepository,
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
        const keeping = oneOnOne.snapshot().schedule.templateKey;
        const meetings = await this.meetingsSoFar.of(
          input.workspaceId,
          input.oneOnOneId,
        );
        const before = OneOnOneSchedule.restore(oneOnOne.snapshot().schedule);
        oneOnOne.reschedule(input.accountId, schedule, now, meetings);
        // The agenda being prepared moves to the new schedule's first day. Each topic keeps the day
        // it was written for, if the old schedule skipped it (or skips it now, overdue), as the new
        // schedule cannot tell.
        const live = await this.meetingRepository.findLive(
          input.workspaceId,
          input.oneOnOneId,
        );
        if (live) {
          live.keepCarriedFrom((topic) =>
            before.carriedFrom(topic.addedAt, now, meetings.heldFor, true),
          );
          await this.meetingRepository.save(live);
        }
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
