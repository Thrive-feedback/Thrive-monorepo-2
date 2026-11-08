import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import type {
  FeedbackSummary,
  FeedbackSummarySnapshot,
} from '../../domain/entity/feedback-summary.entity';
import { FeedbackSummaryRepository } from '../../domain/repository/feedback-summary-repository.port';
import {
  toFeedbackSummaryRecord,
  toFeedbackSummarySnapshot,
} from '../mapper/feedback-summary.mapper';

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaFeedbackSummaryRepository extends FeedbackSummaryRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async save(summary: FeedbackSummary): Promise<void> {
    const record = toFeedbackSummaryRecord(summary);
    const { id: _replacedId, ...withoutId } = record;
    // Upserted on the Member's period rather than created: two relays may both be asked to
    // write the same period, and the second is a replacement, not a second summary.
    await this.prismaTransactionContext.client.feedbackSummary.upsert({
      where: {
        accountId_workspaceId_period: {
          accountId: record.accountId,
          workspaceId: record.workspaceId,
          period: record.period,
        },
      },
      create: record,
      update: withoutId,
    });
  }

  async find(
    accountId: string,
    workspaceId: string,
    period: string,
  ): Promise<FeedbackSummarySnapshot | null> {
    const record =
      await this.prismaTransactionContext.client.feedbackSummary.findUnique({
        where: {
          accountId_workspaceId_period: { accountId, workspaceId, period },
        },
      });
    return record === null ? null : toFeedbackSummarySnapshot(record);
  }
}
