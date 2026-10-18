import { ChatConfig, WebConfig } from '@app/config/configuration';
import { ChatModule } from '@app/infrastructure/chat/chat.module';
import { DiscordBotClient } from '@app/infrastructure/chat/discord/discord-bot.client';
import { SignedHandoff } from '@app/infrastructure/chat/signed-handoff';
import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { WorkspaceModule } from '@app/modules/workspace';
import { Clock } from '@app/shared/application/clock.port';
import { Module } from '@nestjs/common';
import { ChatInstaller } from './application/port/chat-installer.port';
import { InstallHandoff } from './application/port/install-handoff.port';
import { ConnectionQuery } from './application/query-port/connection.query-port';
import { ChatInstallerRegistry } from './application/service/chat-installer-registry.service';
import { BeginInstallUseCase } from './application/use-cases/begin-install.use-case';
import { ChooseChannelUseCase } from './application/use-cases/choose-channel.use-case';
import { CompleteInstallUseCase } from './application/use-cases/complete-install.use-case';
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
 * also uses to message one person — so neither module reaches into the other.
 *
 * Nothing depends on Integrations: a Workspace exists whether or not it has connected anything,
 * which is why the barrel publishes only this module.
 */
@Module({
  imports: [ChatModule, DatabaseModule, WorkspaceModule],
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
    { provide: ConnectionRepository, useClass: PrismaConnectionRepository },
    { provide: ConnectionQuery, useClass: PrismaConnectionQuery },
    BeginInstallUseCase,
    CompleteInstallUseCase,
    ChooseChannelUseCase,
    ListConnectionsUseCase,
    WorkspaceMemberGuard,
  ],
})
export class IntegrationsModule {}
