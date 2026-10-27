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
 * **Nothing a person does may fail because a channel is unreachable** (brain `ADR-0035` §8). Every
 * method here resolves, always, and {@link ConnectionChannelAnnouncer.announce} is what makes that
 * true rather than the caller's own `.catch`: a Workspace that has connected nothing returns in
 * silence, and anything that goes wrong after that is one `warn` line. Giving Feedback and giving
 * Kudos never learn that any of this happened.
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
    await this.announce(event.workspaceId, async () => {
      const nameOf = await this.namesOf([
        event.giverAccountId,
        ...event.receiverAccountIds,
      ]);
      return this.channelCopyService.feedbackPublished({
        giverName: nameOf(event.giverAccountId),
        receiverNames: event.receiverAccountIds.map(nameOf),
        feedbackId: event.feedbackId,
      });
    });
  }

  async kudosGiven(event: KudosGiven): Promise<void> {
    await this.announce(event.workspaceId, async () => {
      const nameOf = await this.namesOf([
        event.giverAccountId,
        ...event.recipientAccountIds,
      ]);
      return this.channelCopyService.kudosGiven({
        giverName: nameOf(event.giverAccountId),
        recipientNames: event.recipientAccountIds.map(nameOf),
        message: event.message,
      });
    });
  }

  /**
   * The one place every announcement passes, and the one place that guarantees the port's
   * promise: this resolves whatever the Workspace read, the name read, the copy or the chat tool
   * does. The caller's `.catch` is a belt to these braces, not the braces.
   *
   * The cheap read comes first, so a Workspace that has connected nothing — the ordinary case —
   * costs one indexed read and stops, with no names resolved and no copy composed.
   */
  private async announce(
    workspaceId: string,
    compose: () => Promise<string>,
  ): Promise<void> {
    try {
      const channels = await this.channelsOf(workspaceId);
      if (channels.length === 0) {
        return;
      }
      await this.post(channels, await compose());
    } catch {
      // Most often a name could not be read. Nothing a person does may fail because somebody
      // could not be told, and an announcement nobody is waiting for is not worth more than a
      // line (brain `ADR-0035` §8).
      this.logger.warn({ event: 'integration.announcement_failed' });
    }
  }

  private channelsOf(workspaceId: string): Promise<readonly PostableChannel[]> {
    return this.connectionQuery.postableChannelsOf(workspaceId);
  }

  /**
   * One read of Identity however many people a post names, so a post about five people costs
   * the same as one about one. Somebody who has not introduced themselves has no name, which the
   * copy words rather than leaving a gap.
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
   * `allSettled`, not a loop with `await`: one channel refusing must not stop another, and they
   * do not wait for each other. At this size that is one call, because a Workspace has at most
   * one Connection per tool.
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
            // stored — said once, and forgotten (brain `ADR-0035` §8). No identifier of
            // anybody's goes in the line: it would be personal data.
            this.logger.warn({
              event: 'integration.channel_post_skipped',
              provider: channel.provider,
            });
          }),
      ),
    );
  }
}
