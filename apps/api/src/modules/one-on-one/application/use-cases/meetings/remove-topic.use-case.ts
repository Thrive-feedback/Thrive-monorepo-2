import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeetingRepository } from '../../../domain/repository/one-on-one-meeting-repository.port';
import { oneOnOneKey } from '../../service/one-on-one-keys.service';
import { OneOnOneMeetingAccessService } from '../../service/one-on-one-meeting-access.service';

export interface RemoveTopicInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: one of the two. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly meetingId: string;
  readonly topicId: string;
}

/** Takes a topic off the agenda: its author, or anyone for a template or carried one. */
@Injectable()
export class RemoveTopicUseCase {
  constructor(
    private readonly access: OneOnOneMeetingAccessService,
    private readonly meetingRepository: OneOnOneMeetingRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: RemoveTopicInput): Promise<void> {
    await this.unitOfWork.run(
      async () => {
        const { meeting } = await this.access.meetingFor(
          input.workspaceId,
          input.oneOnOneId,
          input.meetingId,
          input.accountId,
        );
        meeting.removeTopic(input.topicId, input.accountId);
        await this.meetingRepository.save(meeting);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
