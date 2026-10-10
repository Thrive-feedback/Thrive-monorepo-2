import { AuthModule } from '@app/infrastructure/auth/auth.module';
import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { EmailModule } from '@app/infrastructure/email/email.module';
import { IdentityModule } from '@app/modules/identity';
import { Module } from '@nestjs/common';
import { WorkspaceFounding } from './application/port/workspace-founding.port';
import { WorkspaceInviting } from './application/port/workspace-inviting.port';
import { InvitationQuery } from './application/query-port/invitation.query-port';
import { MembershipQuery } from './application/query-port/membership.query-port';
import { AcceptInvitationUseCase } from './application/use-cases/accept-invitation.use-case';
import { CreateWorkspaceUseCase } from './application/use-cases/create-workspace.use-case';
import { GetInvitationUseCase } from './application/use-cases/get-invitation.use-case';
import { ListMyMembershipsUseCase } from './application/use-cases/list-my-memberships.use-case';
import { ListWorkspaceInvitationsUseCase } from './application/use-cases/list-workspace-invitations.use-case';
import { ListWorkspaceMembersUseCase } from './application/use-cases/list-workspace-members.use-case';
import { ResolveMembershipUseCase } from './application/use-cases/resolve-membership.use-case';
import { RevokeInvitationUseCase } from './application/use-cases/revoke-invitation.use-case';
import { SendInvitationsUseCase } from './application/use-cases/send-invitations.use-case';
import { BetterAuthWorkspaceFoundingAdapter } from './infrastructure/adapter/better-auth-workspace-founding.adapter';
import { BetterAuthWorkspaceInvitingAdapter } from './infrastructure/adapter/better-auth-workspace-inviting.adapter';
import { PrismaInvitationQuery } from './infrastructure/query/prisma-invitation.query';
import { PrismaMembershipQuery } from './infrastructure/query/prisma-membership.query';
import { InvitationController } from './presentation/invitation.controller';
import { InvitationLinkController } from './presentation/invitation-link.controller';
import { MemberController } from './presentation/member.controller';
import { WorkspaceController } from './presentation/workspace.controller';
import { WorkspaceMemberController } from './presentation/workspace-member.controller';
import { WorkspaceMemberGuard } from './presentation/workspace-member.guard';

/**
 * Workspace owns Workspace and Member, which Better Auth's organization plugin stores for it
 * (ADR 0032). It depends on Identity, for whether an Account has a Profile, the name on it and
 * the email each Member is known by, and Identity never depends on it: who is signed in is
 * answered without knowing which Workspace they are in.
 */
@Module({
  imports: [AuthModule, DatabaseModule, EmailModule, IdentityModule],
  controllers: [
    WorkspaceController,
    MemberController,
    WorkspaceMemberController,
    InvitationController,
    InvitationLinkController,
  ],
  providers: [
    {
      provide: WorkspaceFounding,
      useClass: BetterAuthWorkspaceFoundingAdapter,
    },
    {
      provide: WorkspaceInviting,
      useClass: BetterAuthWorkspaceInvitingAdapter,
    },
    { provide: MembershipQuery, useClass: PrismaMembershipQuery },
    { provide: InvitationQuery, useClass: PrismaInvitationQuery },
    CreateWorkspaceUseCase,
    ListMyMembershipsUseCase,
    ResolveMembershipUseCase,
    SendInvitationsUseCase,
    ListWorkspaceMembersUseCase,
    ListWorkspaceInvitationsUseCase,
    GetInvitationUseCase,
    AcceptInvitationUseCase,
    RevokeInvitationUseCase,
    WorkspaceMemberGuard,
  ],
})
export class WorkspaceModule {}
