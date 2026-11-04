import { Injectable } from '@nestjs/common';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { KudosQuery } from '../query-port/kudos.query-port';
import { PersonalItemsService } from '../service/personal-items.service';
import type { FeedPageRequest, FeedPosition } from '../types/kudos.types';
import type {
  PersonalItemsPage,
  ReceivedItemShow,
  ReceivedItemView,
} from '../types/personal-item.types';

export interface ListReceivedItemsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Received list to read: the signed-in caller, always. Never read from the query. */
  readonly receiverAccountId: string;
  /** Which kind of thing to list, or all of them. */
  readonly show: ReceivedItemShow;
  /** Where the last page ended, or `null` for the first page. */
  readonly after: FeedPosition | null;
  readonly limit: number;
}

/** Which reads each choice of `show` makes. */
function reads(show: ReceivedItemShow) {
  return {
    offered: show === 'ALL' || show === 'OFFERED',
    kudos: show === 'ALL' || show === 'KUDOS',
    requests: show === 'ALL' || show === 'REQUESTS',
  };
}

/**
 * A query: everything that comes back to the caller in this Workspace, in one order, newest first,
 * each with the card it was written on (ADR 0080, ADR 0082). That is Feedback given to them
 * unasked, the Kudos that name them, and the requests they sent, each holding every answer to it,
 * so an answer is in its request and nowhere else here (brain `ADR-0053`).
 *
 * The Receiver is an argument to the reads rather than a filter applied after them, so a version of
 * this that lists somebody else's cannot be written by accident, which is the whole authorization
 * rule for this screen. A Member owns what was written to them: not even an Admin reads it.
 */
@Injectable()
export class ListReceivedItemsUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
    private readonly personalItemsService: PersonalItemsService,
  ) {}

  execute(
    input: ListReceivedItemsInput,
  ): Promise<PersonalItemsPage<ReceivedItemView>> {
    const { workspaceId, receiverAccountId } = input;
    const shown = reads(input.show);
    return this.personalItemsService.read({
      workspaceId,
      after: input.after,
      limit: input.limit,
      feedback: shown.offered
        ? (page: FeedPageRequest) =>
            this.feedbackRequestQuery.offeredItemsTo(
              workspaceId,
              receiverAccountId,
              page,
            )
        : undefined,
      // Naming the person leaves out a Kudos for the whole Workspace, which names nobody.
      kudos: shown.kudos
        ? (page: FeedPageRequest) =>
            this.kudosQuery.onHome(workspaceId, page, receiverAccountId)
        : undefined,
      requests: shown.requests
        ? (page: FeedPageRequest) =>
            this.feedbackRequestQuery.sentRequestItemsBy(
              workspaceId,
              receiverAccountId,
              page,
            )
        : undefined,
    });
  }
}
