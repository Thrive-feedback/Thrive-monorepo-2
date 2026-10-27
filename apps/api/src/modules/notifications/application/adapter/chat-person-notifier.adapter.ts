import { Injectable, Logger } from '@nestjs/common';
import { LinkedAccountRepository } from '../../domain/repository/linked-account-repository.port';
import {
  type AskAnswered,
  type AskReceived,
  type FeedbackWritten,
  PersonNotifierPort,
} from '../port/person-notifier.port';
import {
  LinkedAccountQuery,
  type ReachableAccount,
} from '../query-port/linked-account.query-port';
import { ChatCopyService } from '../service/chat-copy.service';
import { DirectMessengerRegistry } from '../service/direct-messenger-registry.service';
import { EventContextService } from '../service/event-context.service';
import { NotificationRecipients } from '../service/notification-recipients.service';

/** One person and the words meant for them, after the rules have decided both. */
interface Delivery {
  readonly accountId: string;
  readonly text: string;
}

/**
 * Delivers what one person is told through the chat tools they chose to link.
 *
 * **Nothing a person does may fail because a chat tool is unreachable** (`ADR-0035` §8). Every
 * method here resolves, always: somebody with no Linked Account returns nothing and is not even
 * logged, and somebody a tool refuses is logged once at `warn` and skipped. Giving Feedback,
 * answering an Ask and sending a request never learn that any of this happened.
 *
 * Everybody a person has linked is messaged, so somebody who links two tools hears twice — the
 * second link reads as a second yes, and silently not using it would be the surprising
 * behaviour (design 0021 D12, accepted 2026-10-24). With one provider it has no observable
 * effect; it binds when the second ships.
 */
@Injectable()
export class ChatPersonNotifier extends PersonNotifierPort {
  private readonly logger = new Logger(ChatPersonNotifier.name);

  constructor(
    private readonly notificationRecipients: NotificationRecipients,
    private readonly linkedAccountQuery: LinkedAccountQuery,
    private readonly linkedAccountRepository: LinkedAccountRepository,
    private readonly directMessengerRegistry: DirectMessengerRegistry,
    private readonly chatCopyService: ChatCopyService,
    private readonly eventContextService: EventContextService,
  ) {
    super();
  }

  async askReceived(event: AskReceived): Promise<void> {
    const [recipients, context] = await Promise.all([
      this.notificationRecipients.of({
        workspaceId: event.workspaceId,
        actorAccountId: event.actorAccountId,
        candidates: event.giverAccountIds,
      }),
      this.eventContextService.of(event),
    ]);
    await this.deliver(
      recipients.flatMap((accountId) => {
        const askId = event.askIdByGiver[accountId];
        // An Ask the caller did not name is not this module's to invent; the person simply is
        // not messaged, rather than being sent somewhere that does not exist.
        return askId
          ? [
              {
                accountId,
                text: this.chatCopyService.askReceived({
                  actorName: context.actorName,
                  workspaceName: context.workspaceName,
                  requestMessage: event.requestMessage,
                  askId,
                }),
              },
            ]
          : [];
      }),
    );
  }

  async askAnswered(event: AskAnswered): Promise<void> {
    const [recipients, context] = await Promise.all([
      this.notificationRecipients.of({
        workspaceId: event.workspaceId,
        actorAccountId: event.actorAccountId,
        candidates: [event.requesterAccountId],
      }),
      this.eventContextService.of(event),
    ]);
    const text = this.chatCopyService.askAnswered({
      actorName: context.actorName,
      workspaceName: context.workspaceName,
      feedbackRequestId: event.feedbackRequestId,
    });
    await this.deliver(recipients.map((accountId) => ({ accountId, text })));
  }

  async feedbackWritten(event: FeedbackWritten): Promise<void> {
    const [recipients, context] = await Promise.all([
      this.notificationRecipients.of({
        workspaceId: event.workspaceId,
        actorAccountId: event.actorAccountId,
        // The Receivers first, so somebody also named under Selected people is de-duplicated to
        // the wording that is true of them: it was written *to* them (#215 AC 5).
        candidates: [
          ...event.receiverAccountIds,
          ...event.sharedWithAccountIds,
        ],
      }),
      this.eventContextService.of(event),
    ]);
    const receivers = new Set(event.receiverAccountIds);
    await this.deliver(
      recipients.map((accountId) => ({
        accountId,
        text: this.chatCopyService.feedbackWritten({
          actorName: context.actorName,
          workspaceName: context.workspaceName,
          feedbackId: event.feedbackId,
          isReceiver: receivers.has(accountId),
        }),
      })),
    );
  }

  /**
   * One read of who is reachable however many people are being told (`BE_06` R9), then every
   * message in flight at once.
   *
   * `allSettled`, not a loop with `await`: one person a tool refuses must not stop the rest
   * (#213 AC 7). At this size — a request asks a handful of people — that is a handful of
   * calls; `BE_18` is where it stops being acceptable, and nothing in this scope goes near it.
   */
  private async deliver(deliveries: readonly Delivery[]): Promise<void> {
    if (deliveries.length === 0) {
      return;
    }
    const reachable = await this.linkedAccountQuery.reachableFor(
      deliveries.map((delivery) => delivery.accountId),
    );
    const linksOf = new Map<string, ReachableAccount[]>();
    for (const link of reachable) {
      linksOf.set(link.accountId, [
        ...(linksOf.get(link.accountId) ?? []),
        link,
      ]);
    }
    await Promise.allSettled(
      deliveries.flatMap((delivery) =>
        // Somebody who has linked nothing is skipped in silence — there is nothing wrong, and
        // nothing to record.
        (linksOf.get(delivery.accountId) ?? []).map((link) =>
          this.sendTo(link, delivery.text),
        ),
      ),
    );
  }

  private async sendTo(link: ReachableAccount, text: string): Promise<void> {
    const messenger = this.directMessengerRegistry.for(link.provider);
    try {
      let channelId = link.directChannelId;
      if (!channelId) {
        channelId = (await messenger.openConversation(link.externalUserId))
          .channelId;
      }
      await messenger.postDirect(channelId, text);
      if (!link.directChannelId) {
        // Only after a message has actually arrived: an id learned from a conversation that
        // then refused the message is not worth keeping (design 0021 D4).
        await this.linkedAccountRepository.rememberConversation({
          accountId: link.accountId,
          provider: link.provider,
          directChannelId: channelId,
        });
      }
    } catch {
      // Unreachable is not an error and is not stored — logged once, and forgotten
      // (`ADR-0035` §8, design 0021 D6). The person is told nothing and neither is anybody
      // else. No identifier of theirs goes in the line: `BE_20`, and it would be personal data.
      this.logger.warn({
        event: 'notification.direct_message_skipped',
        provider: link.provider,
      });
    }
  }
}
