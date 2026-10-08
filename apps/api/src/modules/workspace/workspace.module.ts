import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { IdentityModule } from '@app/modules/identity';
import { Module } from '@nestjs/common';
import { MembershipQuery } from './application/query-port/membership.query-port';
import { CreateWorkspaceUseCase } from './application/use-cases/create-workspace.use-case';
import { ListMyMembershipsUseCase } from './application/use-cases/list-my-memberships.use-case';
import { WorkspaceRepository } from './domain/repository/workspace-repository.port';
import { PrismaMembershipQuery } from './infrastructure/query/prisma-membership.query';
import { PrismaWorkspaceRepository } from './infrastructure/repository/prisma-workspace.repository';
import { MemberController } from './presentation/member.controller';
import { WorkspaceController } from './presentation/workspace.controller';

/**
 * Workspace owns Workspace and Member. It depends on Identity, for whether an Account has
 * a Profile, and Identity never depends on it: who is signed in is answered without
 * knowing which Workspace they are in.
 */
@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [WorkspaceController, MemberController],
  providers: [
    { provide: WorkspaceRepository, useClass: PrismaWorkspaceRepository },
    { provide: MembershipQuery, useClass: PrismaMembershipQuery },
    CreateWorkspaceUseCase,
    ListMyMembershipsUseCase,
  ],
})
export class WorkspaceModule {}
