import { Injectable } from '@nestjs/common';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { KudosQuery } from '../query-port/kudos.query-port';
import { PersonalItemsService } from '../service/personal-items.service';
import type { CursorPageRequest } from '../types/kudos.types';
import type { PersonalItemsView } from '../types/personal-item.types';

export interface ListReceivedItemsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Received list to read: the signed-in caller, always. Never read from the query. */
  readonly receiverAccountId: string;
  readonly page: CursorPageRequest;
}

/**
 * A query: everything written to the caller in this Workspace, Feedback and the Kudos that name them
 * in one order, newest first, each with the card it was written on (ADR 0080).
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

  execute(input: ListReceivedItemsInput): Promise<PersonalItemsView> {
    return this.personalItemsService.read({
      workspaceId: input.workspaceId,
      page: input.page,
      feedback: (page) =>
        this.feedbackRequestQuery.receivedItemsBy(
          input.workspaceId,
          input.receiverAccountId,
          page,
        ),
      // Naming the person leaves out a Kudos for the whole Workspace, which names nobody.
      kudos: (page) =>
        this.kudosQuery.onHome(
          input.workspaceId,
          page,
          input.receiverAccountId,
        ),
    });
  }
}
