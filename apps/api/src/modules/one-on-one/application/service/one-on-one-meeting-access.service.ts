import { Clock } from '@app/shared/application/clock.port';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Injectable } from '@nestjs/common';
import type { OneOnOne } from '../../domain/entity/one-on-one.entity';
import { OneOnOneMeeting } from '../../domain/entity/one-on-one-meeting.entity';
import { OneOnOneMeetingRepository } from '../../domain/repository/one-on-one-meeting-repository.port';
import { OneOnOneRepository } from '../../domain/repository/one-on-one-repository.port';
import {
  OneOnOneMeetingNotFoundError,
  OneOnOneNotFoundError,
} from '../one-on-one.errors';
import { OneOnOneTemplateCatalogService } from './one-on-one-template-catalog.service';

/** Who may read and write a 1:1's meetings, and the next meeting opened when it is first written to. */
@Injectable()
export class OneOnOneMeetingAccessService {
  constructor(
    private readonly oneOnOneRepository: OneOnOneRepository,
    private readonly meetingRepository: OneOnOneMeetingRepository,
    private readonly templateCatalog: OneOnOneTemplateCatalogService,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  /** The 1:1, for one of its two people; anybody else is told it does not exist. */
  async oneOnOneFor(
    workspaceId: string,
    oneOnOneId: string,
    accountId: string,
  ): Promise<OneOnOne> {
    const oneOnOne = await this.oneOnOneRepository.findById(
      workspaceId,
      oneOnOneId,
    );
    if (!oneOnOne?.isIn(accountId)) {
      throw new OneOnOneNotFoundError();
    }
    return oneOnOne;
  }

  /** The 1:1, for one of its two people, while its meetings may be written: while it runs. */
  async runningFor(
    workspaceId: string,
    oneOnOneId: string,
    accountId: string,
  ): Promise<OneOnOne> {
    const oneOnOne = await this.oneOnOneFor(workspaceId, oneOnOneId, accountId);
    oneOnOne.assertMeetingsWritable();
    return oneOnOne;
  }

  /** One meeting of a running 1:1, for one of its two people. */
  async meetingFor(
    workspaceId: string,
    oneOnOneId: string,
    meetingId: string,
    accountId: string,
  ): Promise<{ oneOnOne: OneOnOne; meeting: OneOnOneMeeting }> {
    const oneOnOne = await this.runningFor(workspaceId, oneOnOneId, accountId);
    const meeting = await this.meetingRepository.findById(
      workspaceId,
      oneOnOneId,
      meetingId,
    );
    if (!meeting) {
      throw new OneOnOneMeetingNotFoundError();
    }
    // The meeting's own refusals (finished, already started) come first, from the entity, so only a
    // meeting not yet started is held to the slot here.
    if (meeting.state() === 'PREPARING') {
      oneOnOne.assertMayWriteMeeting(false, this.clock.now());
    }
    return { oneOnOne, meeting };
  }

  /**
   * The next meeting, opened now, for a 1:1 with none open: what was not reached last time first,
   * then the questions of the 1:1's template, as it reads now. Saved by the caller, in its unit of work, which has
   * already found no meeting open.
   */
  async openNext(oneOnOne: OneOnOne): Promise<OneOnOneMeeting> {
    const { id: oneOnOneId, workspaceId, schedule } = oneOnOne.snapshot();
    const last = await this.meetingRepository.findLastFinished(
      workspaceId,
      oneOnOneId,
    );
    oneOnOne.assertMayOpenMeeting(this.clock.now(), last !== null);
    return OneOnOneMeeting.open({
      id: this.idGenerator.next(),
      workspaceId,
      oneOnOneId,
      templateKey: schedule.templateKey,
      carried: last?.undiscussed() ?? [],
      templateQuestions: await this.templateCatalog.questionsOf(
        workspaceId,
        schedule.templateKey,
      ),
      newTopicId: () => this.idGenerator.next(),
    });
  }
}
