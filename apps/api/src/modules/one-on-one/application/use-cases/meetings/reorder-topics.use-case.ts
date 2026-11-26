import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeetingRepository } from '../../../domain/repository/one-on-one-meeting-repository.port';
import { oneOnOneKey } from '../../service/one-on-one-keys.service';
import { OneOnOneMeetingAccessService } from '../../service/one-on-one-meeting-access.service';

export interface ReorderTopicsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: one of the two. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly meetingId: string;
  /** Every topic on the agenda, once, in the new order. */
  readonly topicIds: readonly string[];
}

/** Either person puts the agenda in a new order. */
@Injectable()
export class ReorderTopicsUseCase {
  constructor(
    private readonly access: OneOnOneMeetingAccessService,
    private readonly meetingRepository: OneOnOneMeetingRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: ReorderTopicsInput): Promise<void> {
    await this.unitOfWork.run(
      async () => {
        const { meeting } = await this.access.meetingFor(
          input.workspaceId,
          input.oneOnOneId,
          input.meetingId,
          input.accountId,
        );
        meeting.reorder(input.topicIds);
        await this.meetingRepository.save(meeting);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
