import { FeedbackAboutPersonPort } from '@app/modules/feedback';
import { Clock } from '@app/shared/application/clock.port';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import type { OneOnOneTopicBroughtFrom } from '../../../domain/entity/one-on-one-meeting.entity';
import { OneOnOneMeetingRepository } from '../../../domain/repository/one-on-one-meeting-repository.port';
import { OneOnOneTopicSourceNotFoundError } from '../../one-on-one.errors';
import { oneOnOneKey } from '../../service/one-on-one-keys.service';
import { OneOnOneMeetingAccessService } from '../../service/one-on-one-meeting-access.service';

export interface AddTopicInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: one of the two. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly meetingId: string;
  readonly text: string;
  /** The item of the other person's Profile it is brought from, which must be there for the caller. */
  readonly broughtFrom?: OneOnOneTopicBroughtFrom | null;
}

/**
 * Either person adds a topic to a meeting's agenda, before or during it. One brought from the other
 * person's Profile is checked against that Profile as the caller reads it, so an id from anywhere
 * else is refused rather than kept (brain ADR-0063).
 */
@Injectable()
export class AddTopicUseCase {
  constructor(
    private readonly access: OneOnOneMeetingAccessService,
    private readonly meetingRepository: OneOnOneMeetingRepository,
    private readonly feedbackAboutPerson: FeedbackAboutPersonPort,
    private readonly unitOfWork: UnitOfWork,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: AddTopicInput): Promise<{ readonly id: string }> {
    const id = this.idGenerator.next();
    const broughtFrom = input.broughtFrom ?? null;
    await this.unitOfWork.run(
      async () => {
        const { oneOnOne, meeting } = await this.access.meetingFor(
          input.workspaceId,
          input.oneOnOneId,
          input.meetingId,
          input.accountId,
        );
        if (broughtFrom) {
          const readable = await this.feedbackAboutPerson.isOnProfileFor({
            workspaceId: input.workspaceId,
            readerAccountId: input.accountId,
            aboutAccountId: oneOnOne.otherThan(input.accountId),
            kind: broughtFrom.kind,
            id: broughtFrom.id,
          });
          if (!readable) {
            throw new OneOnOneTopicSourceNotFoundError();
          }
        }
        meeting.addTopic(
          id,
          input.accountId,
          input.text,
          this.clock.now(),
          broughtFrom,
        );
        await this.meetingRepository.save(meeting);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
    return { id };
  }
}
