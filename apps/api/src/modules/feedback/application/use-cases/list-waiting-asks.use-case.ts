import { Injectable } from '@nestjs/common';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { toMyAskView } from '../service/my-ask-view.mapper';
import { PeopleService } from '../service/people.service';
import type {
  WaitingAskSort,
  WaitingAsksView,
} from '../types/feedback-request.types';
import type { CursorPageRequest } from '../types/kudos.types';

export interface ListWaitingAsksInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Asks to list: the signed-in caller, always. Never read from the query. */
  readonly giverAccountId: string;
  readonly sort: WaitingAskSort;
  readonly page: CursorPageRequest;
}

/**
 * A query: the Asks still waiting on the caller in this Workspace, newest or oldest first, for a
 * list that scrolls without end (ADR 0059). Waiting for me reads this; `/home` still reads the offset list.
 */
@Injectable()
export class ListWaitingAsksUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: ListWaitingAsksInput): Promise<WaitingAsksView> {
    const asks = await this.feedbackRequestQuery.waitingAsksFor(
      input.workspaceId,
      input.giverAccountId,
      input.sort,
      input.page,
    );
    const people = await this.peopleService.peopleIn(
      input.workspaceId,
      asks.items.map((ask) => ask.requesterAccountId),
    );
    return {
      items: asks.items.map((ask) => toMyAskView(ask, people)),
      nextAfterId: asks.hasMore ? (asks.items.at(-1)?.askId ?? null) : null,
    };
  }
}
