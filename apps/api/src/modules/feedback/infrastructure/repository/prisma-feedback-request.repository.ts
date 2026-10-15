import { Prisma } from '@app/infrastructure/database/generated/client';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import type { Feedback } from '../../domain/entity/feedback.entity';
import type { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { AskAlreadyAnsweredError } from '../../domain/feedback-request.errors';
import { FeedbackRequestRepository } from '../../domain/repository/feedback-request-repository.port';
import {
  toFeedbackRecord,
  toFeedbackSelectedPersonRecords,
} from '../mapper/feedback.mapper';
import {
  toFeedbackRequest,
  toFeedbackRequestRecord,
} from '../mapper/feedback-request.mapper';

const UNIQUE_VIOLATION = 'P2002';
const ONE_ANSWER_PER_ASK_INDEX = 'feedback_feedbackAskId_key';

/**
 * Two Givers cannot race, but one Giver pressing Send twice can. The loser is told the Ask is
 * already answered, whichever of the two defences catches them: the status is no longer
 * Pending, or the unique index refuses the second answer.
 *
 * With a driver adapter, Prisma names the violated index only deep inside `meta`, in a shape
 * it does not type, so the name is looked for in the whole of it — as Identity's Profile
 * repository already does.
 */
function isSecondAnswerToOneAsk(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== UNIQUE_VIOLATION
  ) {
    return false;
  }
  return JSON.stringify(error.meta ?? {}).includes(ONE_ANSWER_PER_ASK_INDEX);
}

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaFeedbackRequestRepository extends FeedbackRequestRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async save(request: FeedbackRequest): Promise<void> {
    const { asks, selectedPeople, ...record } =
      toFeedbackRequestRecord(request);
    // The request, its Asks and the people it is shared with are one aggregate, so they are
    // written in one statement: a request stored without its Asks would be a request nobody
    // was asked for, and one without its selected people would be read by nobody it promised.
    await this.prismaTransactionContext.client.feedbackRequest.create({
      data: {
        ...record,
        asks: { create: asks.map((ask) => ({ ...ask })) },
        selectedPeople: {
          create: selectedPeople.map((person) => ({ ...person })),
        },
      },
    });
  }

  async findByAskOfGiver(
    workspaceId: string,
    askId: string,
    giverAccountId: string,
  ): Promise<FeedbackRequest | null> {
    const record =
      await this.prismaTransactionContext.client.feedbackRequest.findFirst({
        where: {
          workspaceId,
          asks: { some: { id: askId, giverAccountId } },
        },
        include: {
          asks: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
          selectedPeople: { orderBy: { accountId: 'asc' } },
        },
      });
    return record ? toFeedbackRequest(record) : null;
  }

  async saveAnswer(
    request: FeedbackRequest,
    feedback: Feedback,
  ): Promise<void> {
    const client = this.prismaTransactionContext.client;
    const answer = toFeedbackRecord(feedback);
    const answeredAskId = answer.feedbackAskId;
    const answered = request
      .snapshot()
      .asks.find((ask) => ask.id === answeredAskId);
    if (answeredAskId === null || !answered) {
      throw new Error(
        'The answer names an Ask the Feedback Request does not hold.',
      );
    }
    // Guarded on Pending rather than written blind: no rows updated means another request
    // answered first, which is the same refusal the unique index gives below.
    const flipped = await client.feedbackAsk.updateMany({
      where: { id: answeredAskId, status: 'PENDING' },
      data: { status: answered.status as 'ANSWERED' },
    });
    if (flipped.count === 0) {
      throw new AskAlreadyAnsweredError();
    }
    try {
      await client.feedback.create({
        data: {
          ...answer,
          selectedPeople: { create: toFeedbackSelectedPersonRecords(feedback) },
        },
      });
    } catch (error) {
      if (isSecondAnswerToOneAsk(error)) {
        throw new AskAlreadyAnsweredError();
      }
      throw error;
    }
  }

  async findInWorkspace(
    workspaceId: string,
    requestId: string,
  ): Promise<FeedbackRequest | null> {
    const record =
      await this.prismaTransactionContext.client.feedbackRequest.findFirst({
        where: { id: requestId, workspaceId },
        include: {
          asks: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
          selectedPeople: { orderBy: { accountId: 'asc' } },
        },
      });
    return record ? toFeedbackRequest(record) : null;
  }
}
