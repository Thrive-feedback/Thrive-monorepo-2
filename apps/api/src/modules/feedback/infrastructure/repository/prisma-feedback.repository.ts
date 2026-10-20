import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import type { Feedback } from '../../domain/entity/feedback.entity';
import { FeedbackRepository } from '../../domain/repository/feedback-repository.port';
import {
  toFeedbackMentionRecords,
  toFeedbackRecord,
  toFeedbackSelectedPersonRecords,
  toFeedbackWorkspaceGoalRecords,
} from '../mapper/feedback.mapper';

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaFeedbackRepository extends FeedbackRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async save(feedback: Feedback): Promise<void> {
    // One statement, so Feedback is never stored without the people selected to read it —
    // until they were added it would read as selected for nobody — nor without what it names.
    await this.prismaTransactionContext.client.feedback.create({
      data: {
        ...toFeedbackRecord(feedback),
        selectedPeople: { create: toFeedbackSelectedPersonRecords(feedback) },
        workspaceGoals: { create: toFeedbackWorkspaceGoalRecords(feedback) },
        mentions: { create: toFeedbackMentionRecords(feedback) },
      },
    });
  }
}
