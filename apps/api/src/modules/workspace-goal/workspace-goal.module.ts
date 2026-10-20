import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { WorkspaceModule } from '@app/modules/workspace';
import { Module } from '@nestjs/common';
import { WorkspaceGoalAdapter } from './application/adapter/workspace-goal.adapter';
import { WorkspaceGoalQuery } from './application/query-port/workspace-goal.query-port';
import { CreateWorkspaceGoalUseCase } from './application/use-cases/create-workspace-goal.use-case';
import { FindActiveWorkspaceGoalsUseCase } from './application/use-cases/find-active-workspace-goals.use-case';
import { HideWorkspaceGoalUseCase } from './application/use-cases/hide-workspace-goal.use-case';
import { ListWorkspaceGoalsUseCase } from './application/use-cases/list-workspace-goals.use-case';
import { ShowWorkspaceGoalUseCase } from './application/use-cases/show-workspace-goal.use-case';
import { ActiveWorkspaceGoalPort } from './domain/port/active-workspace-goal.port';
import { WorkspaceGoalRepository } from './domain/repository/workspace-goal-repository.port';
import { PrismaWorkspaceGoalQuery } from './infrastructure/query/prisma-workspace-goal.query';
import { PrismaWorkspaceGoalRepository } from './infrastructure/repository/prisma-workspace-goal.repository';
import { WorkspaceGoalController } from './presentation/workspace-goal.controller';
import { WorkspaceMemberGuard } from './presentation/workspace-member.guard';

/**
 * Workspace Goal owns the hashtags an Admin creates for a Workspace (`ADR-0036`). It depends on
 * Workspace, for whether the caller is a Member of the Workspace and whether they are an Admin
 * there; Workspace never depends on it. It publishes which hashtags name an active Workspace Goal.
 */
@Module({
  imports: [DatabaseModule, WorkspaceModule],
  controllers: [WorkspaceGoalController],
  providers: [
    {
      provide: WorkspaceGoalRepository,
      useClass: PrismaWorkspaceGoalRepository,
    },
    { provide: WorkspaceGoalQuery, useClass: PrismaWorkspaceGoalQuery },
    ListWorkspaceGoalsUseCase,
    CreateWorkspaceGoalUseCase,
    HideWorkspaceGoalUseCase,
    ShowWorkspaceGoalUseCase,
    FindActiveWorkspaceGoalsUseCase,
    WorkspaceMemberGuard,
    WorkspaceGoalAdapter,
    { provide: ActiveWorkspaceGoalPort, useExisting: WorkspaceGoalAdapter },
  ],
  exports: [ActiveWorkspaceGoalPort],
})
export class WorkspaceGoalModule {}
