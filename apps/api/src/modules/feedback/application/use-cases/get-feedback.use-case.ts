import { Injectable } from '@nestjs/common';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { FeedbackNotFoundError } from '../feedback-request.errors';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { PeopleService } from '../service/people.service';
import type { OpenedFeedbackView } from '../types/feedback-request.types';

export interface GetFeedbackInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** The signed-in caller, from the session. Never taken from the path or the body. */
  readonly readerAccountId: string;
  readonly feedbackId: string;
}

/** Whether one Member may read a piece, by the Visibility that piece holds. */
function mayRead(
  readerAccountId: string,
  piece: {
    readonly visibility: string;
    readonly selectedAccountIds: readonly string[];
  },
  people: {
    readonly giverAccountId: string;
    readonly receiverAccountIds: readonly string[];
  },
) {
  return Visibility.of({
    value: piece.visibility,
    selectedAccountIds: piece.selectedAccountIds,
  }).letsRead({ readerAccountId, ...people });
}

/**
 * A query: one piece of Feedback, for anybody its Visibility lets read it — the Giver, the
 * Receiver, and whoever the Requester or, for Offered Feedback, the Giver chose. Everybody else
 * is told it does not exist, the same answer as for an id nothing was written under.
 *
 * An answer comes with the card it is on and the other answers this reader may read, so one read
 * draws the whole postcard (ADR 0072).
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

  async execute(input: GetFeedbackInput): Promise<OpenedFeedbackView> {
    const row = await this.feedbackRequestQuery.feedbackInWorkspace(
      input.workspaceId,
      input.feedbackId,
    );
    if (!row) {
      throw new FeedbackNotFoundError();
    }
    if (
      !mayRead(input.readerAccountId, row, {
        giverAccountId: row.giverAccountId,
        receiverAccountIds: row.receiverAccountIds,
      })
    ) {
      throw new FeedbackNotFoundError();
    }

    const openedRequest = row.feedbackRequestId
      ? await this.feedbackRequestQuery.openedRequest(
          input.workspaceId,
          row.feedbackRequestId,
        )
      : null;
    // Each answer holds its own Visibility: with Only me the Requester reads them all, and a Giver
    // reads their own and no other Giver's.
    const answers =
      openedRequest?.answers.filter((answer) =>
        mayRead(input.readerAccountId, answer, {
          giverAccountId: answer.giverAccountId,
          receiverAccountIds: [openedRequest.requesterAccountId],
        }),
      ) ?? [];

    const people = await this.peopleService.peopleIn(input.workspaceId, [
      row.giverAccountId,
      ...row.receiverAccountIds,
      ...(openedRequest ? [openedRequest.requesterAccountId] : []),
      ...answers.map((answer) => answer.giverAccountId),
    ]);
    return {
      id: row.id,
      origin: row.origin,
      feedbackRequestId: row.feedbackRequestId,
      giverAccountId: row.giverAccountId,
      giverName: people.nameOf(row.giverAccountId),
      giverPhotoUrl: people.photoOf(row.giverAccountId),
      giverStatus: people.statusOf(row.giverAccountId),
      receivers: row.receiverAccountIds.map(people.personOf),
      message: row.message,
      postcard: row.postcard,
      tags: row.tags,
      createdAt: row.createdAt,
      request: openedRequest && {
        message: openedRequest.message,
        tags: openedRequest.tags,
        requester: people.personOf(openedRequest.requesterAccountId),
        postcard: openedRequest.postcard,
        answers: answers.map((answer) => ({
          id: answer.id,
          giver: people.personOf(answer.giverAccountId),
          message: answer.message,
          tags: answer.tags,
          postcard: answer.postcard,
          answeredAt: answer.answeredAt,
        })),
      },
    };
  }
}
