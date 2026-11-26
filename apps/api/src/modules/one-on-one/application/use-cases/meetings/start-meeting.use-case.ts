import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeetingRepository } from '../../../domain/repository/one-on-one-meeting-repository.port';
import { OneOnOneSchedule } from '../../../domain/value-object/one-on-one-schedule.vo';
import { oneOnOneKey } from '../../service/one-on-one-keys.service';
import { OneOnOneMeetingAccessService } from '../../service/one-on-one-meeting-access.service';

export interface StartMeetingInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: one of the two. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly meetingId: string;
}

/**
 * Either person starts the meeting, whenever the two actually meet. It stands for the occurrence
 * about to happen or happening now.
 */
@Injectable()
export class StartMeetingUseCase {
  constructor(
    private readonly access: OneOnOneMeetingAccessService,
    private readonly meetingRepository: OneOnOneMeetingRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: StartMeetingInput): Promise<void> {
    const now = this.clock.now();
    await this.unitOfWork.run(
      async () => {
        const { oneOnOne, meeting } = await this.access.meetingFor(
          input.workspaceId,
          input.oneOnOneId,
          input.meetingId,
          input.accountId,
        );
        const occursAt = OneOnOneSchedule.restore(
          oneOnOne.snapshot().schedule,
        ).upcomingAt(now);
        meeting.start(input.accountId, now, occursAt);
        await this.meetingRepository.save(meeting);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
