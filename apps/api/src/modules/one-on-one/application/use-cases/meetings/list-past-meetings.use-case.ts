import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import {
  calendarDayOf,
  OneOnOneSchedule,
} from '../../../domain/value-object/one-on-one-schedule.vo';
import { OneOnOneStatus } from '../../../domain/value-object/one-on-one-status.vo';
import { OneOnOneNotFoundError } from '../../one-on-one.errors';
import { OneOnOneQuery } from '../../query-port/one-on-one.query-port';
import { OneOnOneMeetingQuery } from '../../query-port/one-on-one-meeting.query-port';
import { toMeetingView } from '../../service/one-on-one-meeting-view.service';
import type {
  OneOnOneMeetingCursorPageRequest,
  OneOnOneMeetingViewPage,
} from '../../types/one-on-one-meeting.types';

export interface ListPastMeetingsInput {
  readonly workspaceId: string;
  readonly accountId: string;
  readonly oneOnOneId: string;
  readonly page: OneOnOneMeetingCursorPageRequest;
}

/**
 * A query: the finished meetings of a 1:1, newest first, each whole: its topics and the notes on
 * them; and the meeting days skipped, oldest first: those kept from a schedule since changed or
 * ended, and those worked out from the one it runs on now. Readable after the 1:1 has ended.
 */
@Injectable()
export class ListPastMeetingsUseCase {
  constructor(
    private readonly oneOnOneQuery: OneOnOneQuery,
    private readonly meetingQuery: OneOnOneMeetingQuery,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: ListPastMeetingsInput,
  ): Promise<OneOnOneMeetingViewPage> {
    const oneOnOne = await this.oneOnOneQuery.findFor(
      input.workspaceId,
      input.oneOnOneId,
      input.accountId,
    );
    if (!oneOnOne) {
      throw new OneOnOneNotFoundError();
    }
    const [page, heldFor] = await Promise.all([
      this.meetingQuery.listFinished(
        input.workspaceId,
        input.oneOnOneId,
        input.page,
      ),
      this.meetingQuery.listHeldFor(input.workspaceId, input.oneOnOneId),
    ]);
    // A 1:1 that has ended kept its skipped days when it ended; one running works out the rest.
    const workedOut = OneOnOneStatus.of(oneOnOne.status).isRunning()
      ? OneOnOneSchedule.restore(oneOnOne.schedule).skippedDays(
          this.clock.now(),
          heldFor,
        )
      : [];
    // With more pages to come, only the days this page reaches back to: older ones belong among
    // meetings not read yet, and would read as one run of skips across them.
    const oldest = page.items.at(-1)?.occursAt ?? null;
    const reachesBack =
      page.nextAfterId === null || oldest === null
        ? null
        : calendarDayOf(oldest);
    const skippedDays = [...new Set([...oneOnOne.skippedDays, ...workedOut])]
      .filter((day) => reachesBack === null || day >= reachesBack)
      .sort();
    return {
      items: page.items.map(toMeetingView),
      nextAfterId: page.nextAfterId,
      skippedDays,
    };
  }
}
