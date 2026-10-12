import { AccountSummaryPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import type {
  FeedbackRequestListView,
  PageRequest,
} from '../types/feedback-request.types';

export interface ListSentFeedbackRequestsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose requests to list: the signed-in caller, always. Never read from the query. */
  readonly requesterAccountId: string;
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
 * A query: the requests the caller sent in this Workspace, newest first, with every Giver
 * named. The Requester is an argument to the read rather than a filter applied after it, so a
 * version of this that lists somebody else's requests cannot be written by accident.
 *
 * Every Giver on the page is named in one call, not one per request (`BE_06` R9), so a page of
 * twenty costs one read and one port call however many Members each request asked.
 */
@Injectable()
export class ListSentFeedbackRequestsUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly accountSummaryPort: AccountSummaryPort,
  ) {}

  async execute(
    input: ListSentFeedbackRequestsInput,
  ): Promise<FeedbackRequestListView> {
    const sent = await this.feedbackRequestQuery.sentInWorkspace(
      input.workspaceId,
      input.requesterAccountId,
      input.page,
    );
    const names = await namesOf(
      this.accountSummaryPort,
      sent.items.flatMap((request) =>
        request.asks.map((ask) => ask.giverAccountId),
      ),
    );

    return {
      items: sent.items.map((request) => ({
        id: request.id,
        topic: request.topic,
        visibility: Visibility.of(request.visibility).toString(),
        asks: request.asks.map((ask) => ({
          askId: ask.askId,
          giverAccountId: ask.giverAccountId,
          giverName: names.get(ask.giverAccountId) ?? null,
          status: AskStatus.of(ask.status).toString(),
          // The list says where each Ask stands, not what was written: a page of twenty
          // requests would carry twenty answers nobody is reading yet. The Receiver opens one
          // request to read its answers.
          answer: null,
        })),
        createdAt: request.createdAt,
      })),
      total: sent.total,
    };
  }
}
