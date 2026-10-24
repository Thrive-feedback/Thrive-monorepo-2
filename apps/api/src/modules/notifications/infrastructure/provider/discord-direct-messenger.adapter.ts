import type { DiscordBotClient } from '@app/infrastructure/chat/discord/discord-bot.client';
import {
  type DirectConversation,
  DirectMessenger,
} from '../../application/port/direct-messenger.port';

/**
 * Discord's half of messaging one person: opening the one-to-one conversation, and writing in
 * it. The only implementation of {@link DirectMessenger} today.
 *
 * Posting goes through the client's existing `postToChannel`, because Discord's send endpoint is
 * the same whether the channel is a server channel or a one-to-one conversation — a second
 * method for the same call would be duplication (`GEN_16`).
 *
 * **Opening is allowed to fail for ordinary reasons.** Discord refuses to let a bot start a
 * conversation with somebody it shares no server with, and a person can close their direct
 * messages. Both read here as "cannot reach this person", which the notifier logs once and
 * skips (`ADR-0035` §8) — they are not faults and are not retried into a storm.
 */
export class DiscordDirectMessenger extends DirectMessenger {
  constructor(private readonly discordBotClient: DiscordBotClient) {
    super();
  }

  async openConversation(externalUserId: string): Promise<DirectConversation> {
    return {
      channelId: await this.discordBotClient.openDirectChannel(externalUserId),
    };
  }

  async postDirect(channelId: string, text: string): Promise<void> {
    await this.discordBotClient.postToChannel(channelId, text);
  }
}
