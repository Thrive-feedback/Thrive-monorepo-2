import { Injectable } from '@nestjs/common';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { FeedbackNotFoundError } from '../feedback-request.errors';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { PeopleService } from '../service/people.service';
import type { FeedbackView } from '../types/feedback-request.types';

export interface GetFeedbackInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, from the session. Never taken from the path or the body. */
  readonly readerAccountId: string;
  readonly feedbackId: string;
}

/**
 * A query: one piece of Feedback, for anybody its Visibility lets read it — the Giver, the
 * Receiver, and whoever the Requester or, for Offered Feedback, the Giver chose. Everybody else
 * is told it does not exist, the same answer as for an id nothing was written under.
 *
 * Membership of the Workspace is proven before this runs, which is what lets Everyone mean
 * every Member and nobody outside the Workspace (ADR 0042).
 */
@Injectable()
export class GetFeedbackUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: GetFeedbackInput): Promise<FeedbackView> {
    const row = await this.feedbackRequestQuery.feedbackInWorkspace(
      input.workspaceId,
      input.feedbackId,
    );
    if (!row) {
      throw new FeedbackNotFoundError();
    }
    const visibility = Visibility.of({
      value: row.visibility,
      selectedAccountIds: row.selectedAccountIds,
    });
    if (
      !visibility.letsRead({
        readerAccountId: input.readerAccountId,
        giverAccountId: row.giverAccountId,
        receiverAccountId: row.receiverAccountId,
      })
    ) {
      throw new FeedbackNotFoundError();
    }

    const people = await this.peopleService.peopleIn(input.workspaceId, [
      row.giverAccountId,
      row.receiverAccountId,
    ]);
    return {
      id: row.id,
      origin: row.origin,
      feedbackRequestId: row.feedbackRequestId,
      topic: row.topic,
      topicTags: row.topicTags,
      giverAccountId: row.giverAccountId,
      giverName: people.nameOf(row.giverAccountId),
      giverStatus: people.statusOf(row.giverAccountId),
      receiverAccountId: row.receiverAccountId,
      receiverName: people.nameOf(row.receiverAccountId),
      receiverStatus: people.statusOf(row.receiverAccountId),
      body: row.body,
      tags: row.tags,
      createdAt: row.createdAt,
    };
  }
}
