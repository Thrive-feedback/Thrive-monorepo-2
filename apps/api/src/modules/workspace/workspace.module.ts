import { AuthModule } from '@app/infrastructure/auth/auth.module';
import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { IdentityModule } from '@app/modules/identity';
import { Module } from '@nestjs/common';
import { WorkspaceFounding } from './application/port/workspace-founding.port';
import { MembershipQuery } from './application/query-port/membership.query-port';
import { CreateWorkspaceUseCase } from './application/use-cases/create-workspace.use-case';
import { ListMyMembershipsUseCase } from './application/use-cases/list-my-memberships.use-case';
import { BetterAuthWorkspaceFoundingAdapter } from './infrastructure/adapter/better-auth-workspace-founding.adapter';
import { PrismaMembershipQuery } from './infrastructure/query/prisma-membership.query';
import { MemberController } from './presentation/member.controller';
import { WorkspaceController } from './presentation/workspace.controller';

/**
 * Workspace owns Workspace and Member, which Better Auth's organization plugin stores for it
 * (ADR 0032). It depends on Identity, for whether an Account has a Profile, and Identity
 * never depends on it: who is signed in is answered without knowing which Workspace they
 * are in.
 */
@Module({
  imports: [AuthModule, DatabaseModule, IdentityModule],
  controllers: [WorkspaceController, MemberController],
  providers: [
    {
      provide: WorkspaceFounding,
      useClass: BetterAuthWorkspaceFoundingAdapter,
    },
    { provide: MembershipQuery, useClass: PrismaMembershipQuery },
    CreateWorkspaceUseCase,
    ListMyMembershipsUseCase,
  ],
})
export class WorkspaceModule {}
