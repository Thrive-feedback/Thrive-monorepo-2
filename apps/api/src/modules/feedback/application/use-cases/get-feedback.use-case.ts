import { Injectable } from '@nestjs/common';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { FeedbackNotFoundError } from '../feedback-request.errors';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { AccountNamesService } from '../service/account-names.service';
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
 * Receiver, and whoever the Requester chose. Everybody else is told it does not exist, the
 * same answer as for an id nothing was written under.
 *
 * Membership of the Workspace is proven before this runs, which is what lets Everyone mean
 * every Member and nobody outside the Workspace (ADR 0042).
 */
@Injectable()
export class GetFeedbackUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly accountNamesService: AccountNamesService,
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

    const names = await this.accountNamesService.namesOf([
      row.giverAccountId,
      row.receiverAccountId,
    ]);
    return {
      id: row.id,
      feedbackRequestId: row.feedbackRequestId,
      topic: row.topic,
      giverAccountId: row.giverAccountId,
      giverName: names.get(row.giverAccountId) ?? null,
      receiverAccountId: row.receiverAccountId,
      receiverName: names.get(row.receiverAccountId) ?? null,
      body: row.body,
      createdAt: row.createdAt,
    };
  }
}
