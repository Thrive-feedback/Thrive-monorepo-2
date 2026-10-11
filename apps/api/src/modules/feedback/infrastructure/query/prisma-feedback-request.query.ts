import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  FeedbackRequestQuery,
  type FeedbackRequestRow,
} from '../../application/query-port/feedback-request.query-port';

/** Reads through `client`, so a read inside a unit of work joins its transaction. */
@Injectable()
export class PrismaFeedbackRequestQuery extends FeedbackRequestQuery {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async requestInWorkspace(
    workspaceId: string,
    requestId: string,
  ): Promise<FeedbackRequestRow | null> {
    const record =
      await this.prismaTransactionContext.client.feedbackRequest.findFirst({
        where: { id: requestId, workspaceId },
        select: {
          id: true,
          topic: true,
          visibility: true,
          createdAt: true,
          asks: {
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            select: { id: true, giverAccountId: true, status: true },
          },
        },
      });
    return record
      ? {
          id: record.id,
          topic: record.topic,
          visibility: record.visibility,
          createdAt: record.createdAt,
          asks: record.asks.map((ask) => ({
            askId: ask.id,
            giverAccountId: ask.giverAccountId,
            status: ask.status,
          })),
        }
      : null;
  }
}
