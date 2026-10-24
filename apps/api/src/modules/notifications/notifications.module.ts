import { ChatConfig, WebConfig } from '@app/config/configuration';
import { ChatModule } from '@app/infrastructure/chat/chat.module';
import { DiscordBotClient } from '@app/infrastructure/chat/discord/discord-bot.client';
import { SignedHandoff } from '@app/infrastructure/chat/signed-handoff';
import { DatabaseModule } from '@app/infrastructure/database/database.module';
import { IdentityModule } from '@app/modules/identity';
import { WorkspaceModule } from '@app/modules/workspace';
import { Clock } from '@app/shared/application/clock.port';
import { Module } from '@nestjs/common';
import { ChatPersonNotifier } from './application/adapter/chat-person-notifier.adapter';
import { FanOutPersonNotifier } from './application/adapter/fan-out-person-notifier.adapter';
import { AccountLinker } from './application/port/account-linker.port';
import { DirectMessenger } from './application/port/direct-messenger.port';
import { LinkHandoff } from './application/port/link-handoff.port';
import { PersonNotifierPort } from './application/port/person-notifier.port';
import { LinkedAccountQuery } from './application/query-port/linked-account.query-port';
import { NotificationQuery } from './application/query-port/notification.query-port';
import { AccountLinkerRegistry } from './application/service/account-linker-registry.service';
import { ChatCopyService } from './application/service/chat-copy.service';
import { DirectMessengerRegistry } from './application/service/direct-messenger-registry.service';
import { EventContextService } from './application/service/event-context.service';
import { NotificationRecipients } from './application/service/notification-recipients.service';
import { BeginAccountLinkUseCase } from './application/use-cases/begin-account-link.use-case';
import { CompleteAccountLinkUseCase } from './application/use-cases/complete-account-link.use-case';
import { CountMyUnreadUseCase } from './application/use-cases/count-my-unread.use-case';
import { ListMyLinkedAccountsUseCase } from './application/use-cases/list-my-linked-accounts.use-case';
import { ListMyNotificationsUseCase } from './application/use-cases/list-my-notifications.use-case';
import { MarkAllReadUseCase } from './application/use-cases/mark-all-read.use-case';
import { MarkNotificationReadUseCase } from './application/use-cases/mark-notification-read.use-case';
import { UnlinkAccountUseCase } from './application/use-cases/unlink-account.use-case';
import { LinkedAccountRepository } from './domain/repository/linked-account-repository.port';
import { NotificationRepository } from './domain/repository/notification-repository.port';
import { DiscordAccountLinker } from './infrastructure/provider/discord-account-linker.adapter';
import { DiscordDirectMessenger } from './infrastructure/provider/discord-direct-messenger.adapter';
import { PrismaLinkedAccountQuery } from './infrastructure/query/prisma-linked-account.query';
import { PrismaNotificationQuery } from './infrastructure/query/prisma-notification.query';
import { PrismaLinkedAccountRepository } from './infrastructure/repository/prisma-linked-account.repository';
import { PrismaNotificationRepository } from './infrastructure/repository/prisma-notification.repository';
import { SignedLinkHandoff } from './infrastructure/signed-link-handoff.adapter';
import { LinkedAccountController } from './presentation/linked-account.controller';
import { NotificationController } from './presentation/notification.controller';
import { WorkspaceMemberGuard } from './presentation/workspace-member.guard';

/**
 * Notifications owns what one person is told, and the Linked Account that lets Thrive tell them
 * through a chat tool. It depends on the application's chat clients, which Integrations also
 * uses to post into a Workspace's channel — so neither module reaches into the other.
 *
 * It depends on Workspace, for who is still an active Member and what a Workspace is called, and
 * on Identity for the names it shows — both through what those modules publish, so neither is
 * reached into, and nothing is read from Feedback at all. Linking itself needs neither: a Member
 * links their own account, so there is no Workspace to resolve and no Role to check.
 *
 * Feedback depends on it, through `PersonNotifierPort` and nothing else.
 */
@Module({
  imports: [ChatModule, DatabaseModule, IdentityModule, WorkspaceModule],
  controllers: [LinkedAccountController, NotificationController],
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
      provide: DirectMessenger,
      useFactory: (discordBotClient: DiscordBotClient): DirectMessenger =>
        new DiscordDirectMessenger(discordBotClient),
      inject: [DiscordBotClient],
    },
    {
      // One entry today, as the linker registry is (design 0021 D3).
      provide: DirectMessengerRegistry,
      useFactory: (discord: DirectMessenger): DirectMessengerRegistry =>
        new DirectMessengerRegistry({ DISCORD: discord }),
      inject: [DirectMessenger],
    },
    // What Feedback calls: one event, two channels. The bell is written for everybody; the
    // chat message goes only to people who linked an account. Rebinding this one token is the
    // whole of what #248 changed on the write side — Feedback's call sites never moved.
    { provide: PersonNotifierPort, useClass: FanOutPersonNotifier },
    ChatPersonNotifier,
    ChatCopyService,
    EventContextService,
    NotificationRecipients,
    {
      provide: LinkedAccountRepository,
      useClass: PrismaLinkedAccountRepository,
    },
    { provide: LinkedAccountQuery, useClass: PrismaLinkedAccountQuery },
    { provide: NotificationRepository, useClass: PrismaNotificationRepository },
    { provide: NotificationQuery, useClass: PrismaNotificationQuery },
    BeginAccountLinkUseCase,
    CompleteAccountLinkUseCase,
    ListMyLinkedAccountsUseCase,
    UnlinkAccountUseCase,
    ListMyNotificationsUseCase,
    CountMyUnreadUseCase,
    MarkNotificationReadUseCase,
    MarkAllReadUseCase,
    WorkspaceMemberGuard,
  ],
  exports: [PersonNotifierPort],
})
export class NotificationsModule {}
