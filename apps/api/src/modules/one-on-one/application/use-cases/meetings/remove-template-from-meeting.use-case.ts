import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeetingRepository } from '../../../domain/repository/one-on-one-meeting-repository.port';
import { oneOnOneKey } from '../../service/one-on-one-keys.service';
import { OneOnOneMeetingAccessService } from '../../service/one-on-one-meeting-access.service';

export interface RemoveTemplateFromMeetingInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: one of the two. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly meetingId: string;
  /** The template whose questions go, as `topics[].templateKey` names it. */
  readonly templateKey: string;
}

/**
 * Either person takes a template off a meeting while it is prepared: every question it asked leaves
 * the agenda at once (ADR 0099). Any template on the agenda may be taken off, whoever used it: a
 * question a template asked is anyone's to remove.
 */
@Injectable()
export class RemoveTemplateFromMeetingUseCase {
  constructor(
    private readonly access: OneOnOneMeetingAccessService,
    private readonly meetingRepository: OneOnOneMeetingRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: RemoveTemplateFromMeetingInput): Promise<void> {
    await this.unitOfWork.run(
      async () => {
        const { meeting } = await this.access.meetingFor(
          input.workspaceId,
          input.oneOnOneId,
          input.meetingId,
          input.accountId,
        );
        meeting.removeTemplate(input.templateKey);
        await this.meetingRepository.save(meeting);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
