import { ChatConfig } from '@app/config/configuration';
import { ChatPoster } from '@app/shared/application/chat-poster.port';
import { Module } from '@nestjs/common';
import { DiscordBotClient } from './discord/discord-bot.client';
import { RegistryChatPoster } from './registry-chat-poster.adapter';

/**
 * Thrive's one client per chat tool. Mirrors `infrastructure/email/email.module.ts`: the credential is read from
 * configuration here, and nothing above this module holds it.
 *
 * It is deliberately outside `modules/integrations/`, so that what a Workspace's channel is
 * told and what one person is told can both post without either module reaching into the other
 * (design 0020 D2).
 */
@Module({
  providers: [
    {
      provide: DiscordBotClient,
      useFactory: (chatConfig: ChatConfig): DiscordBotClient =>
        new DiscordBotClient(
          chatConfig.discordClientId,
          chatConfig.discordClientSecret,
          chatConfig.discordBotToken,
        ),
      inject: [ChatConfig],
    },
    {
      provide: ChatPoster,
      useFactory: (discord: DiscordBotClient): ChatPoster =>
        new RegistryChatPoster({ DISCORD: discord }),
      inject: [DiscordBotClient],
    },
  ],
  exports: [ChatPoster, DiscordBotClient],
})
export class ChatModule {}
