import { AccountSummaryPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';
import {
  AskStatus,
  type AskStatusValue,
} from '../../domain/value-object/ask-status.vo';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
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
 * The name each Account introduced itself with, for a whole page in one call rather than one
 * call per row (`BE_06` R9). A missing Account — deleted mid-read — and one that has not
 * introduced itself both read as `null`, because neither has a name to show.
 */
async function namesOf(
  accountSummaryPort: AccountSummaryPort,
  accountIds: readonly string[],
): Promise<ReadonlyMap<string, string | null>> {
  const summaries = await accountSummaryPort.summariesOf([
    ...new Set(accountIds),
  ]);
  return new Map(
    summaries.map((summary) => [summary.accountId, summary.fullName]),
  );
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
    private readonly accountSummaryPort: AccountSummaryPort,
  ) {}

  async execute(input: ListMyFeedbackAsksInput): Promise<MyAskListView> {
    const asks = await this.feedbackRequestQuery.asksFor(
      input.workspaceId,
      input.giverAccountId,
      input.status,
      input.page,
    );
    const names = await namesOf(
      this.accountSummaryPort,
      asks.items.map((ask) => ask.requesterAccountId),
    );

    return {
      items: asks.items.map((ask) => ({
        askId: ask.askId,
        feedbackRequestId: ask.feedbackRequestId,
        topic: ask.topic,
        requesterAccountId: ask.requesterAccountId,
        // The Requester's Account cascades away with them, as a Giver's does.
        requesterName: names.get(ask.requesterAccountId) ?? null,
        status: AskStatus.of(ask.status).toString(),
        createdAt: ask.createdAt,
      })),
      total: asks.total,
    };
  }
}
