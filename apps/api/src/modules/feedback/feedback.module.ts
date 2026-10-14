import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { IdentityModule } from '@app/modules/identity';
import { WorkspaceModule } from '@app/modules/workspace';
import { Module } from '@nestjs/common';
import { FeedbackRequestQuery } from './application/query-port/feedback-request.query-port';
import { AccountNamesService } from './application/service/account-names.service';
import { AnswerFeedbackAskUseCase } from './application/use-cases/answer-feedback-ask.use-case';
import { GetFeedbackAskUseCase } from './application/use-cases/get-feedback-ask.use-case';
import { GetFeedbackRequestUseCase } from './application/use-cases/get-feedback-request.use-case';
import { ListMyFeedbackAsksUseCase } from './application/use-cases/list-my-feedback-asks.use-case';
import { ListReceivedFeedbackUseCase } from './application/use-cases/list-received-feedback.use-case';
import { ListSentFeedbackRequestsUseCase } from './application/use-cases/list-sent-feedback-requests.use-case';
import { SendFeedbackRequestUseCase } from './application/use-cases/send-feedback-request.use-case';
import { FeedbackRequestRepository } from './domain/repository/feedback-request-repository.port';
import { PrismaFeedbackRequestQuery } from './infrastructure/query/prisma-feedback-request.query';
import { PrismaFeedbackRequestRepository } from './infrastructure/repository/prisma-feedback-request.repository';
import { FeedbackController } from './presentation/feedback.controller';
import { FeedbackAskController } from './presentation/feedback-ask.controller';
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
  controllers: [
    FeedbackRequestController,
    FeedbackAskController,
    FeedbackController,
  ],
  providers: [
    {
      provide: FeedbackRequestRepository,
      useClass: PrismaFeedbackRequestRepository,
    },
    { provide: FeedbackRequestQuery, useClass: PrismaFeedbackRequestQuery },
    AccountNamesService,
    SendFeedbackRequestUseCase,
    GetFeedbackRequestUseCase,
    ListSentFeedbackRequestsUseCase,
    ListMyFeedbackAsksUseCase,
    ListReceivedFeedbackUseCase,
    GetFeedbackAskUseCase,
    AnswerFeedbackAskUseCase,
    WorkspaceMemberGuard,
  ],
})
export class FeedbackModule {}
