import { AccountSummaryPort } from '@app/modules/identity';
import { ChatPoster } from '@app/shared/application/chat-poster.port';
import { Injectable, Logger } from '@nestjs/common';
import {
  ChannelAnnouncerPort,
  type FeedbackPublished,
  type KudosGiven,
} from '../port/channel-announcer.port';
import { ConnectionQuery } from '../query-port/connection.query-port';
import { ChannelCopyService } from '../service/channel-copy.service';
import type { PostableChannel } from '../types/connection.types';

/**
 * Tells a Workspace's connected channels about something that happened in the open.
 *
 * **Nothing a person does may fail because a channel is unreachable** (`ADR-0035` §8). Every method
 * here resolves, always: a Workspace that has connected nothing returns before it reads anything
 * else and is not even logged, and a channel that refuses the post is logged once at `warn` and
 * skipped. Giving Feedback and giving Kudos never learn that any of this happened.
 *
 * **The cheap read comes first.** Most Workspaces have connected nothing, and for those this costs
 * one indexed read and stops — no names resolved, no copy composed, nothing asked of a chat tool.
 */
@Injectable()
export class ConnectionChannelAnnouncer extends ChannelAnnouncerPort {
  private readonly logger = new Logger(ConnectionChannelAnnouncer.name);

  constructor(
    private readonly connectionQuery: ConnectionQuery,
    private readonly accountSummaryPort: AccountSummaryPort,
    private readonly channelCopyService: ChannelCopyService,
    private readonly chatPoster: ChatPoster,
  ) {
    super();
  }

  async feedbackPublished(event: FeedbackPublished): Promise<void> {
    const channels = await this.channelsOf(event.workspaceId);
    if (channels.length === 0) {
      return;
    }
    const nameOf = await this.namesOf([
      event.giverAccountId,
      ...event.receiverAccountIds,
    ]);
    await this.post(
      channels,
      this.channelCopyService.feedbackPublished({
        giverName: nameOf(event.giverAccountId),
        receiverNames: event.receiverAccountIds.map(nameOf),
        feedbackId: event.feedbackId,
      }),
    );
  }

  async kudosGiven(event: KudosGiven): Promise<void> {
    const channels = await this.channelsOf(event.workspaceId);
    if (channels.length === 0) {
      return;
    }
    const nameOf = await this.namesOf([
      event.giverAccountId,
      ...event.recipientAccountIds,
    ]);
    await this.post(
      channels,
      this.channelCopyService.kudosGiven({
        giverName: nameOf(event.giverAccountId),
        recipientNames: event.recipientAccountIds.map(nameOf),
        message: event.message,
      }),
    );
  }

  /**
   * A Workspace that has connected nothing is the ordinary case, and a read that fails is not
   * worth failing an announcement over — both answer "there is nowhere to post".
   */
  private async channelsOf(
    workspaceId: string,
  ): Promise<readonly PostableChannel[]> {
    try {
      return await this.connectionQuery.postableChannelsOf(workspaceId);
    } catch {
      this.logger.warn({ event: 'integration.channels_unreadable' });
      return [];
    }
  }

  /**
   * One read of Identity however many people a post names (`BE_06` R9). Somebody who has not
   * introduced themselves has no name, which the copy words rather than leaving a gap.
   */
  private async namesOf(
    accountIds: readonly string[],
  ): Promise<(accountId: string) => string | null> {
    const summaries = await this.accountSummaryPort.summariesOf([
      ...new Set(accountIds),
    ]);
    const byAccountId = new Map(
      summaries.map((summary) => [summary.accountId, summary.displayName]),
    );
    return (accountId) => byAccountId.get(accountId) ?? null;
  }

  /**
   * `allSettled`, not a loop with `await`: one channel refusing must not stop another. At this
   * size that is one call, because a Workspace has at most one Connection per tool.
   */
  private async post(
    channels: readonly PostableChannel[],
    text: string,
  ): Promise<void> {
    await Promise.allSettled(
      channels.map((channel) =>
        this.chatPoster
          .postToChannel({
            provider: channel.provider,
            channelId: channel.externalChannelId,
            text,
          })
          .catch(() => {
            // Most often the bot was removed from the channel by hand. Not an error and not
            // stored — said once, and forgotten (`ADR-0035` §8). No identifier of anybody's
            // goes in the line: `BE_20`, and it would be personal data.
            this.logger.warn({
              event: 'integration.channel_post_skipped',
              provider: channel.provider,
            });
          }),
      ),
    );
  }
}
