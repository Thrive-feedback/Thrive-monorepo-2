import { Injectable } from '@nestjs/common';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import {
  accountIdsInRequest,
  toAnsweredRequestView,
} from '../service/answered-request.mapping';
import { PeopleService } from '../service/people.service';
import type {
  PageRequest,
  ReceivedFeedbackListView,
} from '../types/feedback-request.types';

export interface ListReceivedFeedbackInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Feedback to list: the signed-in caller, always. Never read from the query. */
  readonly receiverAccountId: string;
  readonly page: PageRequest;
}

/**
 * A query: the Feedback written to the caller in this Workspace — answers to their requests
 * and Feedback given without being asked alike — newest first, with every Giver named.
 *
 * The Receiver is an argument to the read rather than a filter applied after it, so a version
 * of this that lists somebody else's Feedback cannot be written by accident — which is the
 * whole authorization rule for this screen. A Member owns their own history: not even an Admin
 * reads it (`#26`, brain `ADR-0033`, `BE_21` R4/R6). Who *else* may read a piece of Feedback is
 * the Requester's or the Giver's choice, applied where one piece is opened, not on this route.
 */
@Injectable()
export class ListReceivedFeedbackUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(
    input: ListReceivedFeedbackInput,
  ): Promise<ReceivedFeedbackListView> {
    const received = await this.feedbackRequestQuery.receivedBy(
      input.workspaceId,
      input.receiverAccountId,
      input.page,
    );
    // The reader knows it was written to them; the screen names who else it was for and, for an
    // answer, everyone their request asked, so only they are looked up.
    const othersOf = (receiverAccountIds: readonly string[]) =>
      receiverAccountIds.filter(
        (accountId) => accountId !== input.receiverAccountId,
      );
    const people = await this.peopleService.peopleIn(
      input.workspaceId,
      received.items.flatMap((feedback) => [
        feedback.giverAccountId,
        ...othersOf(feedback.receiverAccountIds),
        ...accountIdsInRequest(feedback.request),
      ]),
    );

    return {
      items: received.items.map((feedback) => ({
        id: feedback.id,
        origin: feedback.origin,
        feedbackRequestId: feedback.feedbackRequestId,
        giverAccountId: feedback.giverAccountId,
        // A Giver's Account cascades away with them, so a missing one was deleted mid-read.
        giverName: people.nameOf(feedback.giverAccountId),
        giverPhotoUrl: people.photoOf(feedback.giverAccountId),
        giverStatus: people.statusOf(feedback.giverAccountId),
        otherReceivers: othersOf(feedback.receiverAccountIds).map(
          people.personOf,
        ),
        message: feedback.message,
        tags: feedback.tags,
        createdAt: feedback.createdAt,
        request: toAnsweredRequestView(feedback.request, people),
      })),
      total: received.total,
    };
  }
}
