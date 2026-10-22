import { Injectable } from '@nestjs/common';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { PeopleService } from '../service/people.service';
import type {
  GivenFeedbackListView,
  PageRequest,
} from '../types/feedback-request.types';

export interface ListGivenFeedbackInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Feedback to list: the signed-in caller, always. Never read from the query. */
  readonly giverAccountId: string;
  readonly page: PageRequest;
}

/**
 * A query: the Feedback the caller wrote in this Workspace — answers to the Asks they were sent
 * and Feedback they gave without being asked alike — newest first, with every Receiver named.
 *
 * The Giver is an argument to the read rather than a filter applied after it, so a version of
 * this that lists what somebody else wrote cannot be written by accident: a Member's own history
 * is theirs alone, and no Visibility opens it to anyone else. Who else may read each piece is
 * decided where one piece is opened, not here.
 */
@Injectable()
export class ListGivenFeedbackUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: ListGivenFeedbackInput): Promise<GivenFeedbackListView> {
    const given = await this.feedbackRequestQuery.givenBy(
      input.workspaceId,
      input.giverAccountId,
      input.page,
    );
    const people = await this.peopleService.peopleIn(
      input.workspaceId,
      given.items.flatMap((feedback) => [
        feedback.giverAccountId,
        feedback.receiverAccountId,
      ]),
    );

    return {
      items: given.items.map((feedback) => ({
        id: feedback.id,
        origin: feedback.origin,
        feedbackRequestId: feedback.feedbackRequestId,
        topic: feedback.topic,
        topicTags: feedback.topicTags,
        giverAccountId: feedback.giverAccountId,
        giverName: people.nameOf(feedback.giverAccountId),
        giverStatus: people.statusOf(feedback.giverAccountId),
        receiverAccountId: feedback.receiverAccountId,
        // An Account cascades away with the person, so a missing one was deleted mid-read.
        receiverName: people.nameOf(feedback.receiverAccountId),
        receiverStatus: people.statusOf(feedback.receiverAccountId),
        body: feedback.body,
        tags: feedback.tags,
        createdAt: feedback.createdAt,
      })),
      total: given.total,
    };
  }
}
