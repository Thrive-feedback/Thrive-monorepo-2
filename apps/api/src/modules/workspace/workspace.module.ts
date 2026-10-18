import { AuthModule } from '@app/infrastructure/auth/auth.module';
import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { EmailModule } from '@app/infrastructure/email/email.module';
import { IdentityModule } from '@app/modules/identity';
import { Module } from '@nestjs/common';
import { WorkspaceMembershipAdapter } from './application/adapter/workspace-membership.adapter';
import { InvitationSettling } from './application/port/invitation-settling.port';
import { MemberDeactivating } from './application/port/member-deactivating.port';
import { MemberReactivating } from './application/port/member-reactivating.port';
import { MemberRejoining } from './application/port/member-rejoining.port';
import { MemberRoleChanging } from './application/port/member-role-changing.port';
import { WorkspaceFounding } from './application/port/workspace-founding.port';
import { WorkspaceInviting } from './application/port/workspace-inviting.port';
import { WorkspaceSwitching } from './application/port/workspace-switching.port';
import { InvitationQuery } from './application/query-port/invitation.query-port';
import { MembershipQuery } from './application/query-port/membership.query-port';
import { InvitationDelivery } from './application/service/invitation-delivery.service';
import { ReturningMembers } from './application/service/returning-members.service';
import { AcceptInvitationUseCase } from './application/use-cases/accept-invitation.use-case';
import { ChangeMemberRoleUseCase } from './application/use-cases/change-member-role.use-case';
import { CreateWorkspaceUseCase } from './application/use-cases/create-workspace.use-case';
import { DeactivateMemberUseCase } from './application/use-cases/deactivate-member.use-case';
import { GetInvitationUseCase } from './application/use-cases/get-invitation.use-case';
import { ListMyInvitationsUseCase } from './application/use-cases/list-my-invitations.use-case';
import { ListMyMembershipsUseCase } from './application/use-cases/list-my-memberships.use-case';
import { ListWorkspaceInvitationsUseCase } from './application/use-cases/list-workspace-invitations.use-case';
import { ListWorkspaceMembersUseCase } from './application/use-cases/list-workspace-members.use-case';
import { ReactivateMemberUseCase } from './application/use-cases/reactivate-member.use-case';
import { ResendInvitationUseCase } from './application/use-cases/resend-invitation.use-case';
import { ResolveMembershipUseCase } from './application/use-cases/resolve-membership.use-case';
import { RevokeInvitationUseCase } from './application/use-cases/revoke-invitation.use-case';
import { SendInvitationsUseCase } from './application/use-cases/send-invitations.use-case';
import { SwitchWorkspaceUseCase } from './application/use-cases/switch-workspace.use-case';
import { WorkspaceMembershipPort } from './domain/port/workspace-membership.port';
import { BetterAuthMemberRoleChangingAdapter } from './infrastructure/adapter/better-auth-member-role-changing.adapter';
import { BetterAuthWorkspaceFoundingAdapter } from './infrastructure/adapter/better-auth-workspace-founding.adapter';
import { BetterAuthWorkspaceInvitingAdapter } from './infrastructure/adapter/better-auth-workspace-inviting.adapter';
import { PrismaInvitationSettlingAdapter } from './infrastructure/adapter/prisma-invitation-settling.adapter';
import { PrismaMemberDeactivatingAdapter } from './infrastructure/adapter/prisma-member-deactivating.adapter';
import { PrismaMemberReactivatingAdapter } from './infrastructure/adapter/prisma-member-reactivating.adapter';
import { PrismaMemberRejoiningAdapter } from './infrastructure/adapter/prisma-member-rejoining.adapter';
import { PrismaWorkspaceSwitchingAdapter } from './infrastructure/adapter/prisma-workspace-switching.adapter';
import { PrismaInvitationQuery } from './infrastructure/query/prisma-invitation.query';
import { PrismaMembershipQuery } from './infrastructure/query/prisma-membership.query';
import { InvitationController } from './presentation/invitation.controller';
import { InvitationLinkController } from './presentation/invitation-link.controller';
import { MemberController } from './presentation/member.controller';
import { MyInvitationController } from './presentation/my-invitation.controller';
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
    // Before the link's controller, whose `:invitationId` would otherwise take `mine`.
    MyInvitationController,
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
    {
      provide: MemberRoleChanging,
      useClass: BetterAuthMemberRoleChangingAdapter,
    },
    {
      provide: MemberDeactivating,
      useClass: PrismaMemberDeactivatingAdapter,
    },
    {
      provide: MemberReactivating,
      useClass: PrismaMemberReactivatingAdapter,
    },
    {
      provide: MemberRejoining,
      useClass: PrismaMemberRejoiningAdapter,
    },
    {
      provide: InvitationSettling,
      useClass: PrismaInvitationSettlingAdapter,
    },
    {
      provide: WorkspaceSwitching,
      useClass: PrismaWorkspaceSwitchingAdapter,
    },
    { provide: MembershipQuery, useClass: PrismaMembershipQuery },
    { provide: WorkspaceMembershipPort, useClass: WorkspaceMembershipAdapter },
    { provide: InvitationQuery, useClass: PrismaInvitationQuery },
    CreateWorkspaceUseCase,
    SwitchWorkspaceUseCase,
    ListMyMembershipsUseCase,
    ListMyInvitationsUseCase,
    ResolveMembershipUseCase,
    SendInvitationsUseCase,
    ListWorkspaceMembersUseCase,
    ChangeMemberRoleUseCase,
    DeactivateMemberUseCase,
    ReactivateMemberUseCase,
    ListWorkspaceInvitationsUseCase,
    GetInvitationUseCase,
    AcceptInvitationUseCase,
    RevokeInvitationUseCase,
    ResendInvitationUseCase,
    InvitationDelivery,
    ReturningMembers,
    WorkspaceMemberGuard,
  ],
  // Published so a module acting inside a Workspace can ask whether an Account is a Member
  // of it, without reaching into Workspace's own tables.
  exports: [WorkspaceMembershipPort],
})
export class WorkspaceModule {}
