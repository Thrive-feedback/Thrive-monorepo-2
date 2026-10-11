import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { IdentityModule } from '@app/modules/identity';
import { WorkspaceModule } from '@app/modules/workspace';
import { Module } from '@nestjs/common';
import { FeedbackRequestQuery } from './application/query-port/feedback-request.query-port';
import { GetFeedbackRequestUseCase } from './application/use-cases/get-feedback-request.use-case';
import { SendFeedbackRequestUseCase } from './application/use-cases/send-feedback-request.use-case';
import { FeedbackRequestRepository } from './domain/repository/feedback-request-repository.port';
import { PrismaFeedbackRequestQuery } from './infrastructure/query/prisma-feedback-request.query';
import { PrismaFeedbackRequestRepository } from './infrastructure/repository/prisma-feedback-request.repository';
import { FeedbackRequestController } from './presentation/feedback-request.controller';
import { WorkspaceMemberGuard } from './presentation/workspace-member.guard';

/**
 * Feedback owns Feedback Requests and their Asks. It depends on Workspace, for whether an
 * Account is a Member of the Workspace a request is sent in, and on Identity, for the name
 * each Giver is known by. Neither depends on Feedback: a Workspace and its Members exist
 * whether or not anybody has asked for Feedback.
 */
@Module({
  imports: [DatabaseModule, IdentityModule, WorkspaceModule],
  controllers: [FeedbackRequestController],
  providers: [
    {
      provide: FeedbackRequestRepository,
      useClass: PrismaFeedbackRequestRepository,
    },
    { provide: FeedbackRequestQuery, useClass: PrismaFeedbackRequestQuery },
    SendFeedbackRequestUseCase,
    GetFeedbackRequestUseCase,
    WorkspaceMemberGuard,
  ],
})
export class FeedbackModule {}
