import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { FeedbackModule } from '@app/modules/feedback';
import { WorkspaceModule } from '@app/modules/workspace';
import { Module } from '@nestjs/common';
import { OneOnOneQuery } from './application/query-port/one-on-one.query-port';
import { OneOnOneMeetingQuery } from './application/query-port/one-on-one-meeting.query-port';
import { OneOnOneTemplateQuery } from './application/query-port/one-on-one-template.query-port';
import { OneOnOneMeetingAccessService } from './application/service/one-on-one-meeting-access.service';
import { OneOnOneMeetingsSoFarService } from './application/service/one-on-one-meetings-so-far.service';
import { OneOnOneTemplateCatalogService } from './application/service/one-on-one-template-catalog.service';
import { OneOnOneTemplateNamesService } from './application/service/one-on-one-template-names.service';
import { OneOnOneViewService } from './application/service/one-on-one-view.service';
import { AcceptOneOnOneUseCase } from './application/use-cases/accept-one-on-one.use-case';
import { DeclineOneOnOneUseCase } from './application/use-cases/decline-one-on-one.use-case';
import { EndOneOnOneUseCase } from './application/use-cases/end-one-on-one.use-case';
import { GetOneOnOneUseCase } from './application/use-cases/get-one-on-one.use-case';
import { InviteToOneOnOneUseCase } from './application/use-cases/invite-to-one-on-one.use-case';
import { ListMyOneOnOnesUseCase } from './application/use-cases/list-my-one-on-ones.use-case';
import { AddTopicUseCase } from './application/use-cases/meetings/add-topic.use-case';
import { FinishMeetingUseCase } from './application/use-cases/meetings/finish-meeting.use-case';
import { GetNextMeetingUseCase } from './application/use-cases/meetings/get-next-meeting.use-case';
import { ListPastMeetingsUseCase } from './application/use-cases/meetings/list-past-meetings.use-case';
import { OpenMeetingUseCase } from './application/use-cases/meetings/open-meeting.use-case';
import { RemoveTemplateFromMeetingUseCase } from './application/use-cases/meetings/remove-template-from-meeting.use-case';
import { RemoveTopicUseCase } from './application/use-cases/meetings/remove-topic.use-case';
import { ReorderTopicsUseCase } from './application/use-cases/meetings/reorder-topics.use-case';
import { StartMeetingUseCase } from './application/use-cases/meetings/start-meeting.use-case';
import { UpdateTopicUseCase } from './application/use-cases/meetings/update-topic.use-case';
import { UseTemplateForMeetingUseCase } from './application/use-cases/meetings/use-template-for-meeting.use-case';
import { RescheduleOneOnOneUseCase } from './application/use-cases/reschedule-one-on-one.use-case';
import { SuggestAnotherTimeUseCase } from './application/use-cases/suggest-another-time.use-case';
import { KeepOneOnOneTemplateUseCase } from './application/use-cases/templates/keep-one-on-one-template.use-case';
import { ListOneOnOneTemplatesUseCase } from './application/use-cases/templates/list-one-on-one-templates.use-case';
import { RemoveOneOnOneTemplateUseCase } from './application/use-cases/templates/remove-one-on-one-template.use-case';
import { RewriteOneOnOneTemplateUseCase } from './application/use-cases/templates/rewrite-one-on-one-template.use-case';
import { OneOnOneMeetingRepository } from './domain/repository/one-on-one-meeting-repository.port';
import { OneOnOneRepository } from './domain/repository/one-on-one-repository.port';
import { OneOnOneTemplateRepository } from './domain/repository/one-on-one-template-repository.port';
import { PrismaOneOnOneQuery } from './infrastructure/query/prisma-one-on-one.query';
import { PrismaOneOnOneMeetingQuery } from './infrastructure/query/prisma-one-on-one-meeting.query';
import { PrismaOneOnOneTemplateQuery } from './infrastructure/query/prisma-one-on-one-template.query';
import { PrismaOneOnOneRepository } from './infrastructure/repository/prisma-one-on-one.repository';
import { PrismaOneOnOneMeetingRepository } from './infrastructure/repository/prisma-one-on-one-meeting.repository';
import { PrismaOneOnOneTemplateRepository } from './infrastructure/repository/prisma-one-on-one-template.repository';
import { OneOnOneController } from './presentation/one-on-one.controller';
import { OneOnOneMeetingController } from './presentation/one-on-one-meeting.controller';
import { OneOnOneTemplateController } from './presentation/one-on-one-template.controller';
import { WorkspaceMemberGuard } from './presentation/workspace-member.guard';

/**
 * One-on-one owns the recurring 1:1s two Members of a Workspace keep (brain ADR-0060, proposed):
 * their schedules, their meetings: agendas and the notes both write on each topic, and the templates
 * a Workspace and each Member keep beside Thrive's own. It depends on
 * Workspace, for who is a Member and who is an Admin, and on Feedback, for whether an item brought
 * onto an agenda is one its caller may already read; neither depends on it.
 */
@Module({
  imports: [DatabaseModule, WorkspaceModule, FeedbackModule],
  controllers: [
    OneOnOneController,
    OneOnOneTemplateController,
    OneOnOneMeetingController,
  ],
  providers: [
    { provide: OneOnOneRepository, useClass: PrismaOneOnOneRepository },
    { provide: OneOnOneQuery, useClass: PrismaOneOnOneQuery },
    OneOnOneViewService,
    ListMyOneOnOnesUseCase,
    GetOneOnOneUseCase,
    InviteToOneOnOneUseCase,
    AcceptOneOnOneUseCase,
    DeclineOneOnOneUseCase,
    EndOneOnOneUseCase,
    RescheduleOneOnOneUseCase,
    SuggestAnotherTimeUseCase,
    WorkspaceMemberGuard,
    {
      provide: OneOnOneTemplateRepository,
      useClass: PrismaOneOnOneTemplateRepository,
    },
    { provide: OneOnOneTemplateQuery, useClass: PrismaOneOnOneTemplateQuery },
    OneOnOneTemplateCatalogService,
    OneOnOneTemplateNamesService,
    ListOneOnOneTemplatesUseCase,
    KeepOneOnOneTemplateUseCase,
    RewriteOneOnOneTemplateUseCase,
    RemoveOneOnOneTemplateUseCase,
    {
      provide: OneOnOneMeetingRepository,
      useClass: PrismaOneOnOneMeetingRepository,
    },
    { provide: OneOnOneMeetingQuery, useClass: PrismaOneOnOneMeetingQuery },
    OneOnOneMeetingAccessService,
    OneOnOneMeetingsSoFarService,
    GetNextMeetingUseCase,
    ListPastMeetingsUseCase,
    OpenMeetingUseCase,
    StartMeetingUseCase,
    FinishMeetingUseCase,
    AddTopicUseCase,
    UseTemplateForMeetingUseCase,
    RemoveTemplateFromMeetingUseCase,
    UpdateTopicUseCase,
    RemoveTopicUseCase,
    ReorderTopicsUseCase,
  ],
})
export class OneOnOneModule {}
