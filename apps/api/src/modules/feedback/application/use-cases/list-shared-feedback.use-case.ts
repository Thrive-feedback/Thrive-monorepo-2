import { Injectable } from '@nestjs/common';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { PeopleService } from '../service/people.service';
import type {
  PageRequest,
  SharedFeedbackListView,
} from '../types/feedback-request.types';

export interface ListSharedFeedbackInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Who was selected: the signed-in caller, always. Never read from the query. */
  readonly readerAccountId: string;
  readonly page: PageRequest;
}

/**
 * A query: the Feedback this Member was selected to read — what a Requester or a Giver chose to
 * show them — newest first, with both people named, because the reader is neither of them.
 *
 * It builds no `Visibility`. The read applied it (ADR 0044), so there is nothing here that could
 * widen what came back; the reader is an argument to that read rather than a filter after it, so
 * a version of this that lists what somebody else was shown cannot be written by accident
 * (`BE_21` R4).
 *
 * A piece the caller gave or received cannot appear: neither the Giver nor the Receiver can be
 * selected to read it, so this list never repeats what *Feedback for me* holds.
 */
@Injectable()
export class ListSharedFeedbackUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(
    input: ListSharedFeedbackInput,
  ): Promise<SharedFeedbackListView> {
    const shared = await this.feedbackRequestQuery.sharedWith(
      input.workspaceId,
      input.readerAccountId,
      input.page,
    );
    const people = await this.peopleService.peopleIn(
      input.workspaceId,
      shared.items.flatMap((feedback) => [
        feedback.giverAccountId,
        feedback.receiverAccountId,
      ]),
    );

    return {
      items: shared.items.map((feedback) => ({
        id: feedback.id,
        origin: feedback.origin,
        feedbackRequestId: feedback.feedbackRequestId,
        topic: feedback.topic,
        giverAccountId: feedback.giverAccountId,
        // An Account cascades away with the person, so a missing one was deleted mid-read.
        giverName: people.nameOf(feedback.giverAccountId),
        giverStatus: people.statusOf(feedback.giverAccountId),
        receiverAccountId: feedback.receiverAccountId,
        receiverName: people.nameOf(feedback.receiverAccountId),
        receiverStatus: people.statusOf(feedback.receiverAccountId),
        body: feedback.body,
        createdAt: feedback.createdAt,
      })),
      total: shared.total,
    };
  }
}
