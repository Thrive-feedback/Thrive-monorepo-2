import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeetingRepository } from '../../../domain/repository/one-on-one-meeting-repository.port';
import { oneOnOneKey } from '../../service/one-on-one-keys.service';
import { OneOnOneMeetingAccessService } from '../../service/one-on-one-meeting-access.service';

export interface FinishMeetingInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: one of the two. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly meetingId: string;
}

/**
 * Either person finishes the meeting, which shares its summary with both and closes it: what was
 * not reached carries into the next one.
 */
@Injectable()
export class FinishMeetingUseCase {
  constructor(
    private readonly access: OneOnOneMeetingAccessService,
    private readonly meetingRepository: OneOnOneMeetingRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: FinishMeetingInput): Promise<void> {
    const now = this.clock.now();
    await this.unitOfWork.run(
      async () => {
        const { meeting } = await this.access.meetingFor(
          input.workspaceId,
          input.oneOnOneId,
          input.meetingId,
          input.accountId,
        );
        meeting.finish(input.accountId, now);
        await this.meetingRepository.save(meeting);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
