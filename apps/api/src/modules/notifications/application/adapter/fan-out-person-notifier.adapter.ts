import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationRepository,
  type NotificationToRecord,
} from '../../domain/repository/notification-repository.port';
import type { NotificationTypeValue } from '../../domain/value-object/notification-type.vo';
import {
  type AskAnswered,
  type AskReceived,
  type FeedbackWritten,
  PersonNotifierPort,
} from '../port/person-notifier.port';
import { NotificationRecipients } from '../service/notification-recipients.service';
import { ChatPersonNotifier } from './chat-person-notifier.adapter';

/** One person, and the one thing they are being told about. */
interface Told {
  readonly recipientAccountId: string;
  readonly type: NotificationTypeValue;
  readonly subjectId: string;
}

/**
 * What Feedback actually calls. One event, one port, **two channels**: a line in the person's
 * bell, always, and a message in the chat tools they chose to link, if any.
 *
 * Four things about the shape are deliberate:
 *
 * - **Feedback sees none of this.** It calls the same port it always did; which channels exist
 *   is this module's business, and adding email later changes this file and nothing else.
 * - **In-app is the floor.** The row is written for every recipient whether or not they linked
 *   anything, which is what makes being told not depend on a chat tool, a Connection, or a
 *   setting (`0022/requirement.md` rule 1).
 * - **A chat tool being down does not stop a bell line appearing.** That direction still holds.
 *   The other direction changed with ADR 0076: a row that cannot be written now stops the tick
 *   and the relay tries the whole event again. "Telling somebody in one place beats telling them
 *   in neither" was the right answer when nothing would ever retry; now the gap closes in
 *   seconds, and attempting chat first would mean the retry sent the message twice.
 * - **The row goes before the chat message.** The row is one local insert of a few milliseconds,
 *   and losing it means the person is told by *nothing*. A chat message is two HTTPS round trips
 *   to somebody else's service (design 0022 D5, D6). Both are awaited here, in that order; Feedback
 *   awaits neither, so its request never waits on them.
 *
 * **Since ADR 0076 the two halves fail differently, and deliberately.** The caller is the outbox
 * relay, not a use case, so a failure can be seen and retried rather than swallowed — but only
 * where retrying is safe:
 *
 * - **The row propagates.** `notification` is unique on `(recipient, type, subject)`, so writing
 *   it twice is a no-op and a retry is pure gain. This is what deletes the old line that read "a
 *   lost Notification is accepted": the person was told by nothing, and nobody knew.
 * - **The chat message does not.** A direct message cannot be unsent and has no idempotency key,
 *   so a retry would deliver it twice. It stays logged once and dropped, exactly as before.
 *
 * Nothing a person does fails because of either, and that now holds because no request is waiting
 * on this at all (`ADR-0035` §8).
 */
@Injectable()
export class FanOutPersonNotifier extends PersonNotifierPort {
  private readonly logger = new Logger(FanOutPersonNotifier.name);

  constructor(
    private readonly notificationRecipients: NotificationRecipients,
    private readonly notificationRepository: NotificationRepository,
    private readonly idGenerator: IdGenerator,
    private readonly chatPersonNotifier: ChatPersonNotifier,
  ) {
    super();
  }

  async askReceived(event: AskReceived): Promise<void> {
    const recipients = await this.notificationRecipients.of({
      workspaceId: event.workspaceId,
      actorAccountId: event.actorAccountId,
      candidates: event.giverAccountIds,
    });
    await this.fanOut(
      event,
      recipients.flatMap((recipientAccountId) => {
        const subjectId = event.askIdByGiver[recipientAccountId];
        // An Ask the caller did not name is not this module's to invent.
        return subjectId
          ? [{ recipientAccountId, type: 'ASK_RECEIVED' as const, subjectId }]
          : [];
      }),
      () => this.chatPersonNotifier.askReceived(event),
    );
  }

  async askAnswered(event: AskAnswered): Promise<void> {
    const recipients = await this.notificationRecipients.of({
      workspaceId: event.workspaceId,
      actorAccountId: event.actorAccountId,
      candidates: [event.requesterAccountId],
    });
    await this.fanOut(
      event,
      recipients.map((recipientAccountId) => ({
        recipientAccountId,
        type: 'ASK_ANSWERED' as const,
        subjectId: event.feedbackRequestId,
      })),
      () => this.chatPersonNotifier.askAnswered(event),
    );
  }

  async feedbackWritten(event: FeedbackWritten): Promise<void> {
    const recipients = await this.notificationRecipients.of({
      workspaceId: event.workspaceId,
      actorAccountId: event.actorAccountId,
      // The Receivers first, so somebody also named under Selected people is de-duplicated to
      // the type that is true of them: it was written *to* them (#215 AC 5). The unique index
      // could not do this — the two would carry different types — so the order matters.
      candidates: [...event.receiverAccountIds, ...event.sharedWithAccountIds],
    });
    const receivers = new Set(event.receiverAccountIds);
    await this.fanOut(
      event,
      recipients.map((recipientAccountId) => ({
        recipientAccountId,
        type: receivers.has(recipientAccountId)
          ? ('FEEDBACK_RECEIVED' as const)
          : ('FEEDBACK_SHARED' as const),
        subjectId: event.feedbackId,
      })),
      () => this.chatPersonNotifier.feedbackWritten(event),
    );
  }

  /**
   * The bell first, then the chat tools, each guarded separately.
   *
   * The recipients are resolved once, here, and the chat half resolves them again for itself —
   * one extra read of Workspace per event, after a commit, in exchange for the chat notifier
   * staying usable on its own. That is the trade this makes and it is not free; it would be
   * worth removing if a third channel arrives.
   */
  private async fanOut(
    event: { readonly workspaceId: string; readonly actorAccountId: string },
    told: readonly Told[],
    deliverToChat: () => Promise<void>,
  ): Promise<void> {
    // The row first, and its failure reaches the relay: it is the floor under everything, and
    // retrying it is free.
    await this.record(event.workspaceId, event.actorAccountId, told);
    // The chat message second, and still swallowed: it cannot be unsent, so a retry doubles it
    // rather than repairing it. `ChatPersonNotifier` already logs what it skipped and why.
    await deliverToChat().catch(() => {
      this.logger.warn({ event: 'notification.chat_fan_out_failed' });
    });
  }

  private async record(
    workspaceId: string,
    actorAccountId: string,
    told: readonly Told[],
  ): Promise<void> {
    if (told.length === 0) {
      return;
    }
    const rows: NotificationToRecord[] = told.map((one) => ({
      id: this.idGenerator.next(),
      workspaceId,
      recipientAccountId: one.recipientAccountId,
      type: one.type,
      actorAccountId,
      subjectId: one.subjectId,
    }));
    // One statement for the whole fan-out: five people asked is one round trip, not five.
    // A failure is not caught here — the relay records the attempt and tries again, which is
    // safe because the unique index makes a second write a no-op.
    await this.notificationRepository.recordAll(rows);
  }
}
