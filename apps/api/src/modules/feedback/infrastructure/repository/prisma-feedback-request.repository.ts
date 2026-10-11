import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import type { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { FeedbackRequestRepository } from '../../domain/repository/feedback-request-repository.port';
import {
  toFeedbackRequest,
  toFeedbackRequestRecord,
} from '../mapper/feedback-request.mapper';

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaFeedbackRequestRepository extends FeedbackRequestRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async save(request: FeedbackRequest): Promise<void> {
    const { asks, ...record } = toFeedbackRequestRecord(request);
    // The request and its Asks are one aggregate, so they are written in one statement:
    // a request stored without its Asks would be a request nobody was asked for.
    await this.prismaTransactionContext.client.feedbackRequest.create({
      data: { ...record, asks: { create: asks.map((ask) => ({ ...ask })) } },
    });
  }

  async findInWorkspace(
    workspaceId: string,
    requestId: string,
  ): Promise<FeedbackRequest | null> {
    const record =
      await this.prismaTransactionContext.client.feedbackRequest.findFirst({
        where: { id: requestId, workspaceId },
        include: { asks: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
      });
    return record ? toFeedbackRequest(record) : null;
  }
}
