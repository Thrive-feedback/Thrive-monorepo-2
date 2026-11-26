import { Clock } from '@app/shared/application/clock.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { OneOnOneMeetingRepository } from '../../../domain/repository/one-on-one-meeting-repository.port';
import { oneOnOneKey } from '../../service/one-on-one-keys.service';
import { OneOnOneMeetingAccessService } from '../../service/one-on-one-meeting-access.service';

export interface UpdateTopicInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, always: one of the two. */
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly meetingId: string;
  readonly topicId: string;
  /** A new wording; the author's to change, or anyone's for a template or carried topic. */
  readonly text?: string;
  /** The shared note, with when the caller last read it, so another's change is not overwritten. */
  readonly note?: { readonly text: string; readonly readAt: Date | null };
  readonly discussed?: boolean;
}

/** Either person rewords a topic, writes its shared note, or ticks it discussed. */
@Injectable()
export class UpdateTopicUseCase {
  constructor(
    private readonly access: OneOnOneMeetingAccessService,
    private readonly meetingRepository: OneOnOneMeetingRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateTopicInput): Promise<void> {
    const now = this.clock.now();
    await this.unitOfWork.run(
      async () => {
        const { meeting } = await this.access.meetingFor(
          input.workspaceId,
          input.oneOnOneId,
          input.meetingId,
          input.accountId,
        );
        if (input.text !== undefined) {
          meeting.rewordTopic(input.topicId, input.accountId, input.text);
        }
        if (input.note !== undefined) {
          meeting.writeTopicNote(
            input.topicId,
            input.accountId,
            input.note.text,
            input.note.readAt,
            now,
          );
        }
        if (input.discussed !== undefined) {
          meeting.markDiscussed(input.topicId, input.discussed, now);
        }
        await this.meetingRepository.save(meeting);
      },
      { serializeOn: oneOnOneKey(input.oneOnOneId) },
    );
  }
}
