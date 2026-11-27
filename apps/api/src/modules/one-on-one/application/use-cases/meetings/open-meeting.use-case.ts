import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeetingRepository } from '../../../domain/repository/one-on-one-meeting-repository.port';
import { oneOnOneKey } from '../../service/one-on-one-keys.service';
import { OneOnOneMeetingAccessService } from '../../service/one-on-one-meeting-access.service';

export interface OpenMeetingInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: one of the two. */
  readonly accountId: string;
  readonly oneOnOneId: string;
}

export interface OpenMeetingResult {
  readonly id: string;
  /** Whether this call opened it; `false` when it was already open. */
  readonly opened: boolean;
}

/**
 * Opens the next meeting's agenda, or answers the one already open: what was not reached last time,
 * and nothing from a template until somebody uses one. Idempotent, as a 1:1 has one meeting not
 * finished at a time.
 */
@Injectable()
export class OpenMeetingUseCase {
  constructor(
    private readonly access: OneOnOneMeetingAccessService,
    private readonly meetingRepository: OneOnOneMeetingRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: OpenMeetingInput): Promise<OpenMeetingResult> {
    let result: OpenMeetingResult = { id: '', opened: false };
    await this.unitOfWork.run(
      async () => {
        const oneOnOne = await this.access.runningFor(
          input.workspaceId,
          input.oneOnOneId,
          input.accountId,
        );
        const live = await this.meetingRepository.findLive(
          input.workspaceId,
          input.oneOnOneId,
        );
        const meeting = live ?? (await this.access.openNext(oneOnOne));
        if (!live) {
          await this.meetingRepository.save(meeting);
        }
        result = { id: meeting.snapshot().id, opened: live === null };
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
    return result;
  }
}
