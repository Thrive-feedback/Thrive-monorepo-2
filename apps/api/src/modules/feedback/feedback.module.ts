import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { IdentityModule } from '@app/modules/identity';
import { IntegrationsModule } from '@app/modules/integrations';
import { NotificationsModule } from '@app/modules/notifications';
import { WorkspaceModule } from '@app/modules/workspace';
import { WorkspaceGoalModule } from '@app/modules/workspace-goal';
import { Module } from '@nestjs/common';
import { FeedbackRequestQuery } from './application/query-port/feedback-request.query-port';
import { KudosQuery } from './application/query-port/kudos.query-port';
import { PeopleService } from './application/service/people.service';
import { TagsService } from './application/service/tags.service';
import { AnswerFeedbackAskUseCase } from './application/use-cases/answer-feedback-ask.use-case';
import { GetFeedbackUseCase } from './application/use-cases/get-feedback.use-case';
import { GetFeedbackAskUseCase } from './application/use-cases/get-feedback-ask.use-case';
import { GetFeedbackRequestUseCase } from './application/use-cases/get-feedback-request.use-case';
import { GiveKudosUseCase } from './application/use-cases/give-kudos.use-case';
import { ListFeedItemsUseCase } from './application/use-cases/list-feed-items.use-case';
import { ListMyFeedbackAsksUseCase } from './application/use-cases/list-my-feedback-asks.use-case';
import { ListReceivedFeedbackUseCase } from './application/use-cases/list-received-feedback.use-case';
import { ListSentFeedbackRequestsUseCase } from './application/use-cases/list-sent-feedback-requests.use-case';
import { ListSharedFeedbackUseCase } from './application/use-cases/list-shared-feedback.use-case';
import { ListWorkspaceFeedUseCase } from './application/use-cases/list-workspace-feed.use-case';
import { ListWorkspaceKudosUseCase } from './application/use-cases/list-workspace-kudos.use-case';
import { OfferFeedbackUseCase } from './application/use-cases/offer-feedback.use-case';
import { SendFeedbackRequestUseCase } from './application/use-cases/send-feedback-request.use-case';
import { FeedbackRepository } from './domain/repository/feedback-repository.port';
import { FeedbackRequestRepository } from './domain/repository/feedback-request-repository.port';
import { KudosRepository } from './domain/repository/kudos-repository.port';
import { PrismaFeedbackRequestQuery } from './infrastructure/query/prisma-feedback-request.query';
import { PrismaKudosQuery } from './infrastructure/query/prisma-kudos.query';
import { PrismaFeedbackRepository } from './infrastructure/repository/prisma-feedback.repository';
import { PrismaFeedbackRequestRepository } from './infrastructure/repository/prisma-feedback-request.repository';
import { PrismaKudosRepository } from './infrastructure/repository/prisma-kudos.repository';
import { FeedItemsController } from './presentation/feed-items.controller';
import { FeedbackController } from './presentation/feedback.controller';
import { FeedbackAskController } from './presentation/feedback-ask.controller';
import { FeedbackRequestController } from './presentation/feedback-request.controller';
import { KudosController } from './presentation/kudos.controller';
import { SharedFeedbackController } from './presentation/shared-feedback.controller';
import { WorkspaceFeedController } from './presentation/workspace-feed.controller';
import { WorkspaceMemberGuard } from './presentation/workspace-member.guard';

/**
 * Feedback owns Feedback Requests, their Asks, the Feedback written — in answer or offered — and
 * Kudos.
 * It depends on Workspace, for whether an Account is a Member of the Workspace Feedback is asked
 * for or given in, and on Identity, for the name each Giver is known by and whose slug a Mention
 * names; and on Workspace Goal, for which hashtags name an active Workspace Goal. None depends on
 * Feedback: a Workspace, its Members and its Workspace Goals exist whether or not anybody has
 * asked for Feedback.
 */
@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    IntegrationsModule,
    WorkspaceModule,
    WorkspaceGoalModule,
    NotificationsModule,
  ],
  controllers: [
    FeedbackRequestController,
    FeedbackAskController,
    FeedbackController,
    SharedFeedbackController,
    WorkspaceFeedController,
    FeedItemsController,
    KudosController,
  ],
  providers: [
    {
      provide: FeedbackRequestRepository,
      useClass: PrismaFeedbackRequestRepository,
    },
    { provide: FeedbackRepository, useClass: PrismaFeedbackRepository },
    { provide: FeedbackRequestQuery, useClass: PrismaFeedbackRequestQuery },
    { provide: KudosRepository, useClass: PrismaKudosRepository },
    { provide: KudosQuery, useClass: PrismaKudosQuery },
    PeopleService,
    TagsService,
    SendFeedbackRequestUseCase,
    GetFeedbackRequestUseCase,
    ListSentFeedbackRequestsUseCase,
    ListMyFeedbackAsksUseCase,
    ListReceivedFeedbackUseCase,
    ListSharedFeedbackUseCase,
    ListWorkspaceFeedUseCase,
    ListFeedItemsUseCase,
    GetFeedbackUseCase,
    GetFeedbackAskUseCase,
    AnswerFeedbackAskUseCase,
    OfferFeedbackUseCase,
    GiveKudosUseCase,
    ListWorkspaceKudosUseCase,
    WorkspaceMemberGuard,
  ],
})
export class FeedbackModule {}
