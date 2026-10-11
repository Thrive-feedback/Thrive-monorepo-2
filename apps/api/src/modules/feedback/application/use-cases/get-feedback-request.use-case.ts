import { AccountSummaryPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { FeedbackRequestNotFoundError } from '../feedback-request.errors';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import type { FeedbackRequestView } from '../types/feedback-request.types';

export interface GetFeedbackRequestInput {
  /** The Workspace the caller is a Member of, resolved before this runs (`BE_21` R3). */
  readonly workspaceId: string;
  readonly requestId: string;
}

/**
 * A query: one Feedback Request of the caller's Workspace, with each Giver named. The names
 * are Identity's, read through its published port in one batch rather than one call per Ask.
 */
@Injectable()
export class GetFeedbackRequestUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly accountSummaryPort: AccountSummaryPort,
  ) {}

  async execute(input: GetFeedbackRequestInput): Promise<FeedbackRequestView> {
    const row = await this.feedbackRequestQuery.requestInWorkspace(
      input.workspaceId,
      input.requestId,
    );
    if (!row) {
      throw new FeedbackRequestNotFoundError();
    }

    const summaries = new Map(
      (
        await this.accountSummaryPort.summariesOf(
          row.asks.map((ask) => ask.giverAccountId),
        )
      ).map((summary) => [summary.accountId, summary]),
    );

    return {
      id: row.id,
      topic: row.topic,
      visibility: Visibility.of(row.visibility).toString(),
      asks: row.asks.map((ask) => ({
        askId: ask.askId,
        giverAccountId: ask.giverAccountId,
        // A Giver's Account cascades away with them, so a missing one was deleted mid-read.
        giverName: summaries.get(ask.giverAccountId)?.fullName ?? null,
        status: AskStatus.of(ask.status).toString(),
      })),
      createdAt: row.createdAt,
    };
  }
}
