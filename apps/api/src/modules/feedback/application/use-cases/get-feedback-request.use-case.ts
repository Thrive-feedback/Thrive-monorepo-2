import { AccountSummaryPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { FeedbackRequestNotFoundError } from '../feedback-request.errors';
import type { FeedbackRequestRow } from '../query-port/feedback-request.query-port';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import type { FeedbackRequestView } from '../types/feedback-request.types';

export interface GetFeedbackRequestInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, from the session. Never taken from the path or the body. */
  readonly callerAccountId: string;
  readonly requestId: string;
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
 * Two people may read a Feedback Request: the Requester, whose request it is, and a Giver, who
 * cannot answer what they may not read. Being a Member of the Workspace is not enough — every
 * request is `ONLY_ME` until #83, and a Member who is neither gets the same answer as for a
 * request that does not exist.
 */
function mayRead(row: FeedbackRequestRow, callerAccountId: string): boolean {
  return (
    row.requesterAccountId === callerAccountId ||
    row.asks.some((ask) => ask.giverAccountId === callerAccountId)
  );
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
    if (!row || !mayRead(row, input.callerAccountId)) {
      throw new FeedbackRequestNotFoundError();
    }

    const names = await namesOf(
      this.accountSummaryPort,
      row.asks.map((ask) => ask.giverAccountId),
    );

    return {
      id: row.id,
      topic: row.topic,
      visibility: Visibility.of(row.visibility).toString(),
      asks: row.asks.map((ask) => ({
        askId: ask.askId,
        giverAccountId: ask.giverAccountId,
        // A Giver's Account cascades away with them, so a missing one was deleted mid-read.
        giverName: names.get(ask.giverAccountId) ?? null,
        status: AskStatus.of(ask.status).toString(),
      })),
      createdAt: row.createdAt,
    };
  }
}
