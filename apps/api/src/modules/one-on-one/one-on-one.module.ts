import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { WorkspaceModule } from '@app/modules/workspace';
import { Module } from '@nestjs/common';
import { OneOnOneQuery } from './application/query-port/one-on-one.query-port';
import { OneOnOneMeetingQuery } from './application/query-port/one-on-one-meeting.query-port';
import { OneOnOneMeetingAccessService } from './application/service/one-on-one-meeting-access.service';
import { OneOnOneViewService } from './application/service/one-on-one-view.service';
import { AcceptOneOnOneUseCase } from './application/use-cases/accept-one-on-one.use-case';
import { DeclineOneOnOneUseCase } from './application/use-cases/decline-one-on-one.use-case';
import { EndOneOnOneUseCase } from './application/use-cases/end-one-on-one.use-case';
import { GetOneOnOneUseCase } from './application/use-cases/get-one-on-one.use-case';
import { InviteToOneOnOneUseCase } from './application/use-cases/invite-to-one-on-one.use-case';
import { ListMyOneOnOnesUseCase } from './application/use-cases/list-my-one-on-ones.use-case';
import { ListOneOnOneTemplatesUseCase } from './application/use-cases/list-one-on-one-templates.use-case';
import { AddTopicUseCase } from './application/use-cases/meetings/add-topic.use-case';
import { FinishMeetingUseCase } from './application/use-cases/meetings/finish-meeting.use-case';
import { GetNextMeetingUseCase } from './application/use-cases/meetings/get-next-meeting.use-case';
import { ListPastMeetingsUseCase } from './application/use-cases/meetings/list-past-meetings.use-case';
import { OpenMeetingUseCase } from './application/use-cases/meetings/open-meeting.use-case';
import { RemoveTopicUseCase } from './application/use-cases/meetings/remove-topic.use-case';
import { ReorderTopicsUseCase } from './application/use-cases/meetings/reorder-topics.use-case';
import { StartMeetingUseCase } from './application/use-cases/meetings/start-meeting.use-case';
import { UpdateTopicUseCase } from './application/use-cases/meetings/update-topic.use-case';
import { RescheduleOneOnOneUseCase } from './application/use-cases/reschedule-one-on-one.use-case';
import { SuggestAnotherTimeUseCase } from './application/use-cases/suggest-another-time.use-case';
import { OneOnOneMeetingRepository } from './domain/repository/one-on-one-meeting-repository.port';
import { OneOnOneRepository } from './domain/repository/one-on-one-repository.port';
import { PrismaOneOnOneQuery } from './infrastructure/query/prisma-one-on-one.query';
import { PrismaOneOnOneMeetingQuery } from './infrastructure/query/prisma-one-on-one-meeting.query';
import { PrismaOneOnOneRepository } from './infrastructure/repository/prisma-one-on-one.repository';
import { PrismaOneOnOneMeetingRepository } from './infrastructure/repository/prisma-one-on-one-meeting.repository';
import {
  OneOnOneController,
  OneOnOneTemplateController,
} from './presentation/one-on-one.controller';
import { OneOnOneMeetingController } from './presentation/one-on-one-meeting.controller';
import { WorkspaceMemberGuard } from './presentation/workspace-member.guard';

/**
 * One-on-one owns the recurring 1:1s two Members of a Workspace keep (brain ADR-0060, proposed):
 * their schedules, and their meetings: agendas and the notes both write on each topic. It depends on
 * Workspace, for who is a Member and who is an Admin; Workspace never depends on it.
 */
@Module({
  imports: [DatabaseModule, WorkspaceModule],
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
    ListOneOnOneTemplatesUseCase,
    WorkspaceMemberGuard,
    {
      provide: OneOnOneMeetingRepository,
      useClass: PrismaOneOnOneMeetingRepository,
    },
    { provide: OneOnOneMeetingQuery, useClass: PrismaOneOnOneMeetingQuery },
    OneOnOneMeetingAccessService,
    GetNextMeetingUseCase,
    ListPastMeetingsUseCase,
    OpenMeetingUseCase,
    StartMeetingUseCase,
    FinishMeetingUseCase,
    AddTopicUseCase,
    UpdateTopicUseCase,
    RemoveTopicUseCase,
    ReorderTopicsUseCase,
  ],
})
export class OneOnOneModule {}
