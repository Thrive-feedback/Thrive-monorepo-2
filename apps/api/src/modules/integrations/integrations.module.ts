import { ChatConfig, WebConfig } from '@app/config/configuration';
import { ChatModule } from '@app/infrastructure/chat/chat.module';
import { DiscordBotClient } from '@app/infrastructure/chat/discord/discord-bot.client';
import { SignedHandoff } from '@app/infrastructure/chat/signed-handoff';
import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { IdentityModule } from '@app/modules/identity';
import { WorkspaceModule } from '@app/modules/workspace';
import { Clock } from '@app/shared/application/clock.port';
import { Module } from '@nestjs/common';
import { ConnectionChannelAnnouncer } from './application/adapter/connection-channel-announcer.adapter';
import { ChannelAnnouncerPort } from './application/port/channel-announcer.port';
import { ChatInstaller } from './application/port/chat-installer.port';
import { InstallHandoff } from './application/port/install-handoff.port';
import { ConnectionQuery } from './application/query-port/connection.query-port';
import { ChannelCopyService } from './application/service/channel-copy.service';
import { ChatInstallerRegistry } from './application/service/chat-installer-registry.service';
import { BeginInstallUseCase } from './application/use-cases/begin-install.use-case';
import { ChooseChannelUseCase } from './application/use-cases/choose-channel.use-case';
import { CompleteInstallUseCase } from './application/use-cases/complete-install.use-case';
import { DisconnectIntegrationUseCase } from './application/use-cases/disconnect-integration.use-case';
import { ListConnectionsUseCase } from './application/use-cases/list-connections.use-case';
import { ConnectionRepository } from './domain/repository/connection-repository.port';
import { DiscordChatInstaller } from './infrastructure/provider/discord-chat-installer.adapter';
import { PrismaConnectionQuery } from './infrastructure/query/prisma-connection.query';
import { PrismaConnectionRepository } from './infrastructure/repository/prisma-connection.repository';
import { SignedInstallHandoff } from './infrastructure/signed-install-handoff.adapter';
import { IntegrationController } from './presentation/integration.controller';
import { WorkspaceMemberGuard } from './presentation/workspace-member.guard';

/**
 * Integrations owns a Workspace's Connection to one chat tool and the channel it posts in. It
 * depends on Workspace, for whether the caller is a Member of the Workspace being connected and
 * whether they are an Admin there, and on the application's chat clients, which Notifications
 * also uses to message one person — so neither module reaches into the other. It reads Identity's
 * `AccountSummaryPort` for the names a channel post puts in a sentence.
 *
 * Feedback depends on it, through `ChannelAnnouncerPort` and nothing else: what a shared channel
 * is told is Integrations' to own, where what one person is told is Notifications' (brain
 * `ADR-0035` §9, ADR 0062). A Workspace still exists whether or not it has connected anything, and
 * a Workspace that has connected nothing is announced to in silence.
 */
@Module({
  imports: [ChatModule, DatabaseModule, IdentityModule, WorkspaceModule],
  controllers: [IntegrationController],
  providers: [
    {
      provide: ChatInstaller,
      useFactory: (
        discordBotClient: DiscordBotClient,
        chatConfig: ChatConfig,
        webConfig: WebConfig,
      ): ChatInstaller =>
        new DiscordChatInstaller(
          discordBotClient,
          chatConfig.discordClientId,
          webConfig.origin,
        ),
      inject: [DiscordBotClient, ChatConfig, WebConfig],
    },
    {
      // One entry today. A second chat tool is one more adapter and one more entry here, and
      // no change in any use case (design 0020 D12).
      provide: ChatInstallerRegistry,
      useFactory: (discord: ChatInstaller): ChatInstallerRegistry =>
        new ChatInstallerRegistry({ DISCORD: discord }),
      inject: [ChatInstaller],
    },
    {
      // Signed with the application's own Discord secret rather than a fourth configuration
      // value: one secret, one purpose family (design 0020 §6).
      provide: InstallHandoff,
      useFactory: (chatConfig: ChatConfig, clock: Clock): InstallHandoff =>
        new SignedInstallHandoff(
          new SignedHandoff(chatConfig.discordClientSecret, clock),
        ),
      inject: [ChatConfig, Clock],
    },
    // What Feedback calls when something happens in the open. Integrations owns it because it
    // owns the Connection and what the channel is told (brain `ADR-0035` §9, ADR 0062).
    { provide: ChannelAnnouncerPort, useClass: ConnectionChannelAnnouncer },
    ChannelCopyService,
    { provide: ConnectionRepository, useClass: PrismaConnectionRepository },
    { provide: ConnectionQuery, useClass: PrismaConnectionQuery },
    BeginInstallUseCase,
    CompleteInstallUseCase,
    ChooseChannelUseCase,
    DisconnectIntegrationUseCase,
    ListConnectionsUseCase,
    WorkspaceMemberGuard,
  ],
  exports: [ChannelAnnouncerPort],
})
export class IntegrationsModule {}
