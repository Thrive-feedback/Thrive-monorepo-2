import { Injectable } from '@nestjs/common';
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
 * them. Readable after the 1:1 has ended.
 */
@Injectable()
export class ListPastMeetingsUseCase {
  constructor(
    private readonly oneOnOneQuery: OneOnOneQuery,
    private readonly meetingQuery: OneOnOneMeetingQuery,
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
    const page = await this.meetingQuery.listFinished(
      input.workspaceId,
      input.oneOnOneId,
      input.page,
    );
    return {
      items: page.items.map(toMeetingView),
      nextAfterId: page.nextAfterId,
    };
  }
}
