import { Clock } from '@app/shared/application/clock.port';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeetingRepository } from '../../../domain/repository/one-on-one-meeting-repository.port';
import { oneOnOneKey } from '../../service/one-on-one-keys.service';
import { OneOnOneMeetingAccessService } from '../../service/one-on-one-meeting-access.service';
import { OneOnOneTemplateCatalogService } from '../../service/one-on-one-template-catalog.service';

export interface UseTemplateForMeetingInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: one of the two. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly meetingId: string;
  /** One of Thrive's keys, or the id of a template the caller may use. */
  readonly templateKey: string;
}

/**
 * Either person uses a template for a meeting while it is prepared: its questions take the place of
 * the last template's on the agenda. Only a template the caller may choose is used.
 */
@Injectable()
export class UseTemplateForMeetingUseCase {
  constructor(
    private readonly access: OneOnOneMeetingAccessService,
    private readonly templateCatalog: OneOnOneTemplateCatalogService,
    private readonly meetingRepository: OneOnOneMeetingRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: UseTemplateForMeetingInput): Promise<void> {
    await this.unitOfWork.run(
      async () => {
        const { meeting } = await this.access.meetingFor(
          input.workspaceId,
          input.oneOnOneId,
          input.meetingId,
          input.accountId,
        );
        await this.templateCatalog.assertChoosable(
          input.workspaceId,
          input.accountId,
          input.templateKey,
        );
        meeting.useTemplate({
          templateKey: input.templateKey,
          questions: await this.templateCatalog.questionsOf(
            input.workspaceId,
            input.templateKey,
          ),
          newTopicId: () => this.idGenerator.next(),
          at: this.clock.now(),
        });
        await this.meetingRepository.save(meeting);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
