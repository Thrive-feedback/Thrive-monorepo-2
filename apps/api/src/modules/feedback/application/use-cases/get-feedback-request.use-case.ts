import { AccountSummaryPort } from '@app/modules/identity';
import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { FeedbackRequestNotFoundError } from '../feedback-request.errors';
import type {
  FeedbackAnswerRow,
  FeedbackRequestRow,
} from '../query-port/feedback-request.query-port';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import type {
  AnswerView,
  FeedbackRequestView,
} from '../types/feedback-request.types';

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
 * What the caller may read of one Ask's answer: everything, if the request is theirs and they
 * are the Receiver of what it collected; their own answer, if they are the Giver who wrote it;
 * nothing otherwise. Until #84 gives the Requester a choice of audience, those two are the
 * only people an answer reaches (`ADR-0022`, `#24` AC 5).
 */
function answerFor(
  ask: { readonly askId: string; readonly giverAccountId: string },
  answers: ReadonlyMap<string, FeedbackAnswerRow>,
  callerAccountId: string,
  requesterAccountId: string,
): AnswerView | null {
  const isReceiver = callerAccountId === requesterAccountId;
  const wroteIt = callerAccountId === ask.giverAccountId;
  if (!isReceiver && !wroteIt) {
    return null;
  }
  const answer = answers.get(ask.askId);
  return answer ? { body: answer.body, answeredAt: answer.answeredAt } : null;
}

/**
 * A query: one Feedback Request of the caller's Workspace, with each Giver named and each
 * answer the caller may read. The names are Identity's, read through its published port in one
 * batch rather than one call per Ask.
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

    const [names, answerRows] = await Promise.all([
      namesOf(
        this.accountSummaryPort,
        row.asks.map((ask) => ask.giverAccountId),
      ),
      this.feedbackRequestQuery.answersInRequest(
        input.workspaceId,
        input.requestId,
      ),
    ]);
    const answers = new Map(answerRows.map((answer) => [answer.askId, answer]));

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
        answer: answerFor(
          ask,
          answers,
          input.callerAccountId,
          row.requesterAccountId,
        ),
      })),
      createdAt: row.createdAt,
    };
  }
}
