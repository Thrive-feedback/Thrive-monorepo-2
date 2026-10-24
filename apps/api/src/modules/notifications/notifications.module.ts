import { ChatConfig, WebConfig } from '@app/config/configuration';
import { ChatModule } from '@app/infrastructure/chat/chat.module';
import { DiscordBotClient } from '@app/infrastructure/chat/discord/discord-bot.client';
import { SignedHandoff } from '@app/infrastructure/chat/signed-handoff';
import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { Clock } from '@app/shared/application/clock.port';
import { Module } from '@nestjs/common';
import { AccountLinker } from './application/port/account-linker.port';
import { LinkHandoff } from './application/port/link-handoff.port';
import { LinkedAccountQuery } from './application/query-port/linked-account.query-port';
import { AccountLinkerRegistry } from './application/service/account-linker-registry.service';
import { BeginAccountLinkUseCase } from './application/use-cases/begin-account-link.use-case';
import { CompleteAccountLinkUseCase } from './application/use-cases/complete-account-link.use-case';
import { ListMyLinkedAccountsUseCase } from './application/use-cases/list-my-linked-accounts.use-case';
import { UnlinkAccountUseCase } from './application/use-cases/unlink-account.use-case';
import { LinkedAccountRepository } from './domain/repository/linked-account-repository.port';
import { DiscordAccountLinker } from './infrastructure/provider/discord-account-linker.adapter';
import { PrismaLinkedAccountQuery } from './infrastructure/query/prisma-linked-account.query';
import { PrismaLinkedAccountRepository } from './infrastructure/repository/prisma-linked-account.repository';
import { SignedLinkHandoff } from './infrastructure/signed-link-handoff.adapter';
import { LinkedAccountController } from './presentation/linked-account.controller';

/**
 * Notifications owns what one person is told, and the Linked Account that lets Thrive tell them
 * through a chat tool. It depends on the application's chat clients, which Integrations also
 * uses to post into a Workspace's channel — so neither module reaches into the other.
 *
 * It depends on **no other module**: a Member links their own account, so there is no Workspace
 * to resolve and no Role to check. Nothing depends on it yet either; the port that lets Feedback
 * message somebody arrives with #213, and the barrel is where it will be published.
 */
@Module({
  imports: [ChatModule, DatabaseModule],
  controllers: [LinkedAccountController],
  providers: [
    {
      provide: AccountLinker,
      useFactory: (
        discordBotClient: DiscordBotClient,
        chatConfig: ChatConfig,
        webConfig: WebConfig,
      ): AccountLinker =>
        new DiscordAccountLinker(
          discordBotClient,
          chatConfig.discordClientId,
          webConfig.origin,
        ),
      inject: [DiscordBotClient, ChatConfig, WebConfig],
    },
    {
      // One entry today. A second chat tool is one more adapter and one more entry here, and
      // no change in any use case (design 0021 D3).
      provide: AccountLinkerRegistry,
      useFactory: (discord: AccountLinker): AccountLinkerRegistry =>
        new AccountLinkerRegistry({ DISCORD: discord }),
      inject: [AccountLinker],
    },
    {
      // Signed with the application's own Discord secret rather than a fourth configuration
      // value: one secret, one purpose family (design 0020 §6, inherited by 0021).
      provide: LinkHandoff,
      useFactory: (chatConfig: ChatConfig, clock: Clock): LinkHandoff =>
        new SignedLinkHandoff(
          new SignedHandoff(chatConfig.discordClientSecret, clock),
        ),
      inject: [ChatConfig, Clock],
    },
    {
      provide: LinkedAccountRepository,
      useClass: PrismaLinkedAccountRepository,
    },
    { provide: LinkedAccountQuery, useClass: PrismaLinkedAccountQuery },
    BeginAccountLinkUseCase,
    CompleteAccountLinkUseCase,
    ListMyLinkedAccountsUseCase,
    UnlinkAccountUseCase,
  ],
})
export class NotificationsModule {}
