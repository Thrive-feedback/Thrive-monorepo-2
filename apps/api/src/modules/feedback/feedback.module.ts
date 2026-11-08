import { AiModule } from '@app/infrastructure/ai/ai.module';
import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { IdentityModule } from '@app/modules/identity';
import { IntegrationsModule } from '@app/modules/integrations';
import { NotificationsModule } from '@app/modules/notifications';
import { WorkspaceModule } from '@app/modules/workspace';
import { WorkspaceGoalModule } from '@app/modules/workspace-goal';
import { Module } from '@nestjs/common';
import { FeedbackSummaryOutboxHandler } from './application/adapter/feedback-summary-outbox.adapter';
import { FeedbackRequestQuery } from './application/query-port/feedback-request.query-port';
import { KudosQuery } from './application/query-port/kudos.query-port';
import { SummaryCorpusQuery } from './application/query-port/summary-corpus.query-port';
import { PeopleService } from './application/service/people.service';
import { PersonalItemsService } from './application/service/personal-items.service';
import { SummaryPromptService } from './application/service/summary-prompt.service';
import { SummaryRefreshService } from './application/service/summary-refresh.service';
import { TagsService } from './application/service/tags.service';
import { AnswerFeedbackAskUseCase } from './application/use-cases/answer-feedback-ask.use-case';
import { GetFeedbackUseCase } from './application/use-cases/get-feedback.use-case';
import { GetFeedbackAskUseCase } from './application/use-cases/get-feedback-ask.use-case';
import { GetMyFeedbackSummaryUseCase } from './application/use-cases/get-my-feedback-summary.use-case';
import { GiveKudosUseCase } from './application/use-cases/give-kudos.use-case';
import { ListFeedItemsUseCase } from './application/use-cases/list-feed-items.use-case';
import { ListGivenItemsUseCase } from './application/use-cases/list-given-items.use-case';
import { ListKudosMonthsUseCase } from './application/use-cases/list-kudos-months.use-case';
import { ListMyFeedbackAsksUseCase } from './application/use-cases/list-my-feedback-asks.use-case';
import { ListReceivedItemsUseCase } from './application/use-cases/list-received-items.use-case';
import { ListWaitingAsksUseCase } from './application/use-cases/list-waiting-asks.use-case';
import { ListWorkspaceKudosUseCase } from './application/use-cases/list-workspace-kudos.use-case';
import { OfferFeedbackUseCase } from './application/use-cases/offer-feedback.use-case';
import { RefreshFeedbackSummaryUseCase } from './application/use-cases/refresh-feedback-summary.use-case';
import { SendFeedbackRequestUseCase } from './application/use-cases/send-feedback-request.use-case';
import { FeedbackRepository } from './domain/repository/feedback-repository.port';
import { FeedbackRequestRepository } from './domain/repository/feedback-request-repository.port';
import { FeedbackSummaryRepository } from './domain/repository/feedback-summary-repository.port';
import { KudosRepository } from './domain/repository/kudos-repository.port';
import { PrismaFeedbackRequestQuery } from './infrastructure/query/prisma-feedback-request.query';
import { PrismaKudosQuery } from './infrastructure/query/prisma-kudos.query';
import { PrismaSummaryCorpusQuery } from './infrastructure/query/prisma-summary-corpus.query';
import { PrismaFeedbackRepository } from './infrastructure/repository/prisma-feedback.repository';
import { PrismaFeedbackRequestRepository } from './infrastructure/repository/prisma-feedback-request.repository';
import { PrismaFeedbackSummaryRepository } from './infrastructure/repository/prisma-feedback-summary.repository';
import { PrismaKudosRepository } from './infrastructure/repository/prisma-kudos.repository';
import { FeedItemsController } from './presentation/feed-items.controller';
import { FeedbackController } from './presentation/feedback.controller';
import { FeedbackAskController } from './presentation/feedback-ask.controller';
import { FeedbackRequestController } from './presentation/feedback-request.controller';
import { FeedbackSummaryController } from './presentation/feedback-summary.controller';
import { GivenItemsController } from './presentation/given-items.controller';
import { KudosController } from './presentation/kudos.controller';
import { ReceivedItemsController } from './presentation/received-items.controller';
import { WaitingAsksController } from './presentation/waiting-asks.controller';
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
    AiModule,
  ],
  controllers: [
    FeedbackRequestController,
    FeedbackAskController,
    FeedbackController,
    FeedbackSummaryController,
    FeedItemsController,
    ReceivedItemsController,
    GivenItemsController,
    WaitingAsksController,
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
    {
      provide: FeedbackSummaryRepository,
      useClass: PrismaFeedbackSummaryRepository,
    },
    { provide: SummaryCorpusQuery, useClass: PrismaSummaryCorpusQuery },
    PeopleService,
    PersonalItemsService,
    TagsService,
    SendFeedbackRequestUseCase,
    ListMyFeedbackAsksUseCase,
    ListReceivedItemsUseCase,
    ListGivenItemsUseCase,
    ListFeedItemsUseCase,
    ListWaitingAsksUseCase,
    GetFeedbackUseCase,
    GetFeedbackAskUseCase,
    AnswerFeedbackAskUseCase,
    OfferFeedbackUseCase,
    GiveKudosUseCase,
    ListWorkspaceKudosUseCase,
    ListKudosMonthsUseCase,
    SummaryPromptService,
    SummaryRefreshService,
    GetMyFeedbackSummaryUseCase,
    RefreshFeedbackSummaryUseCase,
    FeedbackSummaryOutboxHandler,
    WorkspaceMemberGuard,
  ],
  // The composition root names the handler the relay drains (ADR 0076 D1), so it has to be
  // reachable from outside this module.
  exports: [FeedbackSummaryOutboxHandler],
})
export class FeedbackModule {}
