import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import {
  mayOpenMeeting,
  meetingWritable,
} from '../../../domain/entity/one-on-one.entity';
import { undiscussedOf } from '../../../domain/entity/one-on-one-meeting.entity';
import { OneOnOneSchedule } from '../../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneStatus } from '../../../domain/value-object/one-on-one-status.vo';
import { OneOnOneNotFoundError } from '../../one-on-one.errors';
import { OneOnOneQuery } from '../../query-port/one-on-one.query-port';
import { OneOnOneMeetingQuery } from '../../query-port/one-on-one-meeting.query-port';
import { toMeetingView } from '../../service/one-on-one-meeting-view.service';
import { OneOnOneTemplateCatalogService } from '../../service/one-on-one-template-catalog.service';
import type { OneOnOneNextMeetingView } from '../../types/one-on-one-meeting.types';

export interface GetNextMeetingInput {
  readonly workspaceId: string;
  /** The signed-in caller, always: one of the two. */
  readonly accountId: string;
  readonly oneOnOneId: string;
}

/**
 * A query: the next meeting of a 1:1 as its panel shows it — the live one, or what it will open
 * with.
 */
@Injectable()
export class GetNextMeetingUseCase {
  constructor(
    private readonly oneOnOneQuery: OneOnOneQuery,
    private readonly meetingQuery: OneOnOneMeetingQuery,
    private readonly templateCatalog: OneOnOneTemplateCatalogService,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetNextMeetingInput): Promise<OneOnOneNextMeetingView> {
    const oneOnOne = await this.oneOnOneQuery.findFor(
      input.workspaceId,
      input.oneOnOneId,
      input.accountId,
    );
    if (!oneOnOne) {
      throw new OneOnOneNotFoundError();
    }
    const live = await this.meetingQuery.findLive(
      input.workspaceId,
      input.oneOnOneId,
    );
    const status = OneOnOneStatus.of(oneOnOne.status);
    const schedule = OneOnOneSchedule.restore(oneOnOne.schedule);
    const now = this.clock.now();
    // An agenda that can no longer be written to, never started before a one-time slot passed, is
    // not offered as the next meeting: the 1:1 reads as met.
    if (
      live &&
      meetingWritable(status, schedule, live.startedAt !== null, now)
    ) {
      const { templateKey } = live;
      return {
        meeting: toMeetingView(live),
        carried: [],
        templateQuestions: [],
        templateName:
          templateKey === null
            ? null
            : await this.templateCatalog.nameOf(input.workspaceId, templateKey),
      };
    }
    const last = await this.meetingQuery.findLastFinished(
      input.workspaceId,
      input.oneOnOneId,
    );
    // Nothing is offered that cannot open: a 1:1 that has ended, or a one-time one that has met.
    const mayOpen =
      !live && mayOpenMeeting(status, schedule, now, last !== null);
    if (!mayOpen) {
      return {
        meeting: null,
        carried: [],
        templateQuestions: [],
        templateName: null,
      };
    }
    // It opens with what was not reached last time, and no template until somebody uses one.
    return {
      meeting: null,
      carried: last ? undiscussedOf(last.topics) : [],
      templateQuestions: [],
      templateName: null,
    };
  }
}
