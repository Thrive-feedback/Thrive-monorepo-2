import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { IdentityModule } from '@app/modules/identity';
import { WorkspaceModule } from '@app/modules/workspace';
import { Module } from '@nestjs/common';
import { FeedbackRequestQuery } from './application/query-port/feedback-request.query-port';
import { AccountNamesService } from './application/service/account-names.service';
import { AnswerFeedbackAskUseCase } from './application/use-cases/answer-feedback-ask.use-case';
import { GetFeedbackUseCase } from './application/use-cases/get-feedback.use-case';
import { GetFeedbackAskUseCase } from './application/use-cases/get-feedback-ask.use-case';
import { GetFeedbackRequestUseCase } from './application/use-cases/get-feedback-request.use-case';
import { ListMyFeedbackAsksUseCase } from './application/use-cases/list-my-feedback-asks.use-case';
import { ListReceivedFeedbackUseCase } from './application/use-cases/list-received-feedback.use-case';
import { ListSentFeedbackRequestsUseCase } from './application/use-cases/list-sent-feedback-requests.use-case';
import { ListSharedFeedbackUseCase } from './application/use-cases/list-shared-feedback.use-case';
import { ListWorkspaceFeedUseCase } from './application/use-cases/list-workspace-feed.use-case';
import { OfferFeedbackUseCase } from './application/use-cases/offer-feedback.use-case';
import { SendFeedbackRequestUseCase } from './application/use-cases/send-feedback-request.use-case';
import { FeedbackRepository } from './domain/repository/feedback-repository.port';
import { FeedbackRequestRepository } from './domain/repository/feedback-request-repository.port';
import { PrismaFeedbackRequestQuery } from './infrastructure/query/prisma-feedback-request.query';
import { PrismaFeedbackRepository } from './infrastructure/repository/prisma-feedback.repository';
import { PrismaFeedbackRequestRepository } from './infrastructure/repository/prisma-feedback-request.repository';
import { FeedbackController } from './presentation/feedback.controller';
import { FeedbackAskController } from './presentation/feedback-ask.controller';
import { FeedbackRequestController } from './presentation/feedback-request.controller';
import { SharedFeedbackController } from './presentation/shared-feedback.controller';
import { WorkspaceFeedController } from './presentation/workspace-feed.controller';
import { WorkspaceMemberGuard } from './presentation/workspace-member.guard';

/**
 * Feedback owns Feedback Requests, their Asks, and the Feedback written — in answer or offered.
 * It depends on Workspace, for whether an Account is a Member of the Workspace Feedback is asked
 * for or given in, and on Identity, for the name each Giver is known by. Neither depends on Feedback: a Workspace and its Members exist
 * whether or not anybody has asked for Feedback.
 */
@Module({
  imports: [DatabaseModule, IdentityModule, WorkspaceModule],
  controllers: [
    FeedbackRequestController,
    FeedbackAskController,
    FeedbackController,
    SharedFeedbackController,
    WorkspaceFeedController,
  ],
  providers: [
    {
      provide: FeedbackRequestRepository,
      useClass: PrismaFeedbackRequestRepository,
    },
    { provide: FeedbackRepository, useClass: PrismaFeedbackRepository },
    { provide: FeedbackRequestQuery, useClass: PrismaFeedbackRequestQuery },
    AccountNamesService,
    SendFeedbackRequestUseCase,
    GetFeedbackRequestUseCase,
    ListSentFeedbackRequestsUseCase,
    ListMyFeedbackAsksUseCase,
    ListReceivedFeedbackUseCase,
    ListSharedFeedbackUseCase,
    ListWorkspaceFeedUseCase,
    GetFeedbackUseCase,
    GetFeedbackAskUseCase,
    AnswerFeedbackAskUseCase,
    OfferFeedbackUseCase,
    WorkspaceMemberGuard,
  ],
})
export class FeedbackModule {}
