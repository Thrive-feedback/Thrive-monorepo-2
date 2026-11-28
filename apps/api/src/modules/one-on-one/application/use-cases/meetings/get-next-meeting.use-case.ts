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
import { OneOnOneTemplateNamesService } from '../../service/one-on-one-template-names.service';
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
/** Nothing on the agenda was written for a day since skipped. */
const NOTHING_CARRIED = {
  carriedFromSkipped: null,
  carriedTopics: [],
} as const;

@Injectable()
export class GetNextMeetingUseCase {
  constructor(
    private readonly oneOnOneQuery: OneOnOneQuery,
    private readonly meetingQuery: OneOnOneMeetingQuery,
    private readonly templateNames: OneOnOneTemplateNamesService,
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
      // Every template on the agenda, each once, in the order its questions first appear.
      const inUse = [
        ...new Set(
          live.topics.flatMap((topic) =>
            topic.templateKey === null ? [] : [topic.templateKey],
          ),
        ),
      ];
      const templates = await this.templateNames.namesOf(
        input.workspaceId,
        templateKey !== null && !inUse.includes(templateKey)
          ? [...inUse, templateKey]
          : inUse,
      );
      return {
        meeting: toMeetingView(live),
        ...(live.startedAt === null
          ? await this.carriedFromSkipped(
              input.workspaceId,
              input.oneOnOneId,
              schedule,
              live.topics,
              now,
            )
          : NOTHING_CARRIED),
        carried: [],
        templateQuestions: [],
        templateName:
          templates.find((template) => template.key === templateKey)?.name ??
          null,
        templates: templates.filter((template) => inUse.includes(template.key)),
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
        ...NOTHING_CARRIED,
        carried: [],
        templateQuestions: [],
        templateName: null,
        templates: [],
      };
    }
    // It opens with what was not reached last time, and no template until somebody uses one.
    return {
      meeting: null,
      ...NOTHING_CARRIED,
      carried: last ? undiscussedOf(last.topics) : [],
      templateQuestions: [],
      templateName: null,
      templates: [],
    };
  }

  /**
   * Which topics were written for a meeting day that was then skipped, each with that day, and the
   * earliest of them: the agenda moved on from it to the day due. Topics added since say what they
   * are as usual.
   */
  private async carriedFromSkipped(
    workspaceId: string,
    oneOnOneId: string,
    schedule: OneOnOneSchedule,
    topics: readonly {
      readonly id: string;
      readonly addedAt: Date;
      readonly carriedFrom: string | null;
    }[],
    now: Date,
  ): Promise<
    Pick<OneOnOneNextMeetingView, 'carriedFromSkipped' | 'carriedTopics'>
  > {
    const heldFor = await this.meetingQuery.listHeldFor(
      workspaceId,
      oneOnOneId,
    );
    const carriedTopics = topics.flatMap((topic) => {
      // Kept at a change of schedule, or worked out from the one it runs on now.
      const from =
        topic.carriedFrom ?? schedule.carriedFrom(topic.addedAt, now, heldFor);
      return from === null ? [] : [{ topicId: topic.id, from }];
    });
    const earliest = carriedTopics.map((each) => each.from).sort()[0];
    return { carriedFromSkipped: earliest ?? null, carriedTopics };
  }
}
