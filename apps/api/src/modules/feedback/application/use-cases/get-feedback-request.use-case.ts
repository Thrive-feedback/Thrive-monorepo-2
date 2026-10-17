import { Injectable } from '@nestjs/common';
import { AskStatus } from '../../domain/value-object/ask-status.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { FeedbackRequestNotFoundError } from '../feedback-request.errors';
import type {
  FeedbackAnswerRow,
  FeedbackRequestRow,
} from '../query-port/feedback-request.query-port';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { PeopleService } from '../service/people.service';
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
 * Two people may read a Feedback Request: the Requester, whose request it is, and a Giver, who
 * cannot answer what they may not read. Being a Member of the Workspace is not enough, and
 * neither is being one of the people it is shared with: Visibility decides who reads the
 * Feedback a request collects, not the request itself — who else was asked, and who has not
 * answered yet. A Member who is neither gets the same answer as for a request that does not
 * exist (ADR 0039, ADR 0042).
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
 * nothing otherwise. A Giver reads no other Giver's answer here even when the Visibility would
 * let them, because this screen is the Requester's and the Giver's; the people a request is
 * shared with read its Feedback one piece at a time (`ADR-0022`, `#24` AC 5).
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
 * answer the caller may read. Only the Requester is told who else reads the answers; a Giver is
 * not (`ADR-0022`). The names are Identity's and whether each person is still active is
 * Workspace's, both read through their published ports in one batch rather than one call per Ask.
 */
@Injectable()
export class GetFeedbackRequestUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly peopleService: PeopleService,
  ) {}

  async execute(input: GetFeedbackRequestInput): Promise<FeedbackRequestView> {
    const row = await this.feedbackRequestQuery.requestInWorkspace(
      input.workspaceId,
      input.requestId,
    );
    if (!row || !mayRead(row, input.callerAccountId)) {
      throw new FeedbackRequestNotFoundError();
    }

    const isRequester = row.requesterAccountId === input.callerAccountId;
    const visibility = Visibility.of({
      value: row.visibility,
      selectedAccountIds: row.selectedAccountIds,
    });
    const [people, answerRows] = await Promise.all([
      this.peopleService.peopleIn(input.workspaceId, [
        ...row.asks.map((ask) => ask.giverAccountId),
        ...(isRequester ? visibility.selectedAccountIds() : []),
      ]),
      this.feedbackRequestQuery.answersInRequest(
        input.workspaceId,
        input.requestId,
      ),
    ]);
    const answers = new Map(answerRows.map((answer) => [answer.askId, answer]));

    return {
      id: row.id,
      topic: row.topic,
      visibility: isRequester
        ? {
            value: visibility.toString(),
            selectedPeople: visibility
              .selectedAccountIds()
              .map((accountId) => ({
                accountId,
                name: people.nameOf(accountId),
                status: people.statusOf(accountId),
              })),
          }
        : null,
      asks: row.asks.map((ask) => ({
        askId: ask.askId,
        giverAccountId: ask.giverAccountId,
        // A Giver's Account cascades away with them, so a missing one was deleted mid-read.
        giverName: people.nameOf(ask.giverAccountId),
        giverStatus: people.statusOf(ask.giverAccountId),
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
