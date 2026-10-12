import { AccountSummaryPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import { FeedbackAskNotFoundError } from '../feedback-request.errors';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import type { MyAskView } from '../types/feedback-request.types';

export interface GetFeedbackAskInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, from the session. An Ask is only ever read by its own Giver. */
  readonly giverAccountId: string;
  readonly askId: string;
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
 * A query: one Ask waiting on the caller — who asked, and about what — which is what the screen
 * that answers it shows. The Giver is part of the read, so an Ask addressed to somebody else is
 * not found rather than refused, and nobody learns it exists.
 */
@Injectable()
export class GetFeedbackAskUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly accountSummaryPort: AccountSummaryPort,
  ) {}

  async execute(input: GetFeedbackAskInput): Promise<MyAskView> {
    const ask = await this.feedbackRequestQuery.askFor(
      input.workspaceId,
      input.giverAccountId,
      input.askId,
    );
    if (!ask) {
      throw new FeedbackAskNotFoundError();
    }
    const names = await namesOf(this.accountSummaryPort, [
      ask.requesterAccountId,
    ]);

    return {
      askId: ask.askId,
      feedbackRequestId: ask.feedbackRequestId,
      topic: ask.topic,
      requesterAccountId: ask.requesterAccountId,
      requesterName: names.get(ask.requesterAccountId) ?? null,
      status: AskStatus.of(ask.status).toString(),
      createdAt: ask.createdAt,
    };
  }
}
