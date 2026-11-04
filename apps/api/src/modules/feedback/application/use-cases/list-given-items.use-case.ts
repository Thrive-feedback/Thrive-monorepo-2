import { Injectable } from '@nestjs/common';
import { Visibility } from '../../domain/value-object/visibility.vo';
import {
  FeedbackRequestQuery,
  type GivenFeedbackRow,
  type ReceivedFeedbackRow,
} from '../query-port/feedback-request.query-port';
import { KudosQuery } from '../query-port/kudos.query-port';
import { PersonalItemsService } from '../service/personal-items.service';
import type { CursorPageRequest } from '../types/kudos.types';
import type { PersonalItemsView } from '../types/personal-item.types';

export interface ListGivenItemsInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Whose Given list to read: the signed-in caller, always. Never read from the query. */
  readonly giverAccountId: string;
  readonly page: CursorPageRequest;
}

/**
 * The piece with only the answers its Giver may read. Who was asked and where each stands stays, and
 * another Giver's words go, by the rule that opens a postcard (ADR 0072, ADR 0081).
 */
function withAnswersReadableBy(
  readerAccountId: string,
  row: GivenFeedbackRow,
): ReceivedFeedbackRow {
  const { request } = row;
  return {
    ...row,
    request: request && {
      ...request,
      asks: request.asks.map(({ answerAudience, ...ask }) => ({
        ...ask,
        answer:
          answerAudience &&
          Visibility.of({
            value: answerAudience.visibility,
            selectedAccountIds: answerAudience.selectedAccountIds,
          }).letsRead({
            readerAccountId,
            giverAccountId: ask.giverAccountId,
            receiverAccountIds: [request.requesterAccountId],
          })
            ? ask.answer
            : null,
      })),
    },
  };
}

/**
 * A query: everything the caller wrote in this Workspace, Feedback at every Visibility and every
 * Kudos, in one order, newest first, each with the card it was written on (ADR 0081).
 *
 * The Giver is an argument to the reads rather than a filter applied after them, so a version of
 * this that lists somebody else's cannot be written by accident.
 */
@Injectable()
export class ListGivenItemsUseCase {
  constructor(
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
    private readonly personalItemsService: PersonalItemsService,
  ) {}

  async execute(input: ListGivenItemsInput): Promise<PersonalItemsView> {
    const after = await this.personalItemsService.positionAfter(
      input.workspaceId,
      input.page.afterId,
    );
    if (after === undefined) {
      return { items: [], nextAfterId: null };
    }
    const given = await this.personalItemsService.read({
      workspaceId: input.workspaceId,
      after,
      limit: input.page.limit,
      feedback: async (page) => {
        const given = await this.feedbackRequestQuery.givenItemsBy(
          input.workspaceId,
          input.giverAccountId,
          page,
        );
        return {
          items: given.items.map((row) =>
            withAnswersReadableBy(input.giverAccountId, row),
          ),
          hasMore: given.hasMore,
        };
      },
      kudos: (page) =>
        this.kudosQuery.givenBy(input.workspaceId, input.giverAccountId, page),
    });
    return { items: given.items, nextAfterId: given.next?.id ?? null };
  }
}
