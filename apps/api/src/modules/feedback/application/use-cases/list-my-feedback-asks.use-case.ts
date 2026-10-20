import { Injectable } from '@nestjs/common';
import {
  AskStatus,
  type AskStatusValue,
} from '../../domain/value-object/ask-status.vo';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { PeopleService } from '../service/people.service';
import type {
  MyAskListView,
  PageRequest,
} from '../types/feedback-request.types';

export interface ListMyFeedbackAsksInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Asks to list: the signed-in caller, always. Never read from the query. */
  readonly giverAccountId: string;
  /** Which state to list. `PENDING` is the waiting list; the others are #27 and #39. */
  readonly status: AskStatusValue;
  readonly page: PageRequest;
}

/**
 * A query: the Asks addressed to the caller in this Workspace, newest first, each naming the
 * Member who asked. This is the only read of an Ask that has no request id — with Notifications
 * at Low priority (`ADR-0006`), it is how a Giver learns they were asked at all.
 */
@Injectable()
export class ListMyFeedbackAsksUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: ListMyFeedbackAsksInput): Promise<MyAskListView> {
    const asks = await this.feedbackRequestQuery.asksFor(
      input.workspaceId,
      input.giverAccountId,
      input.status,
      input.page,
    );
    const people = await this.peopleService.peopleIn(
      input.workspaceId,
      asks.items.map((ask) => ask.requesterAccountId),
    );

    return {
      items: asks.items.map((ask) => ({
        askId: ask.askId,
        feedbackRequestId: ask.feedbackRequestId,
        topic: ask.topic,
        topicTags: ask.topicTags,
        requesterAccountId: ask.requesterAccountId,
        // The Requester's Account cascades away with them, as a Giver's does.
        requesterName: people.nameOf(ask.requesterAccountId),
        requesterStatus: people.statusOf(ask.requesterAccountId),
        status: AskStatus.of(ask.status).toString(),
        createdAt: ask.createdAt,
      })),
      total: asks.total,
    };
  }
}
