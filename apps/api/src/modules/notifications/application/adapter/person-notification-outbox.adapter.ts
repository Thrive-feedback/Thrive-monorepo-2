import {
  OutboxHandler,
  type OutboxMessageRead,
  UnprocessableOutboxMessage,
} from '@app/shared/application/outbox-handler.port';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { NOTIFICATION_AUDIENCES } from '../../domain/value-object/notification-audience.vo';
import { PersonNotifierPort } from '../port/person-notifier.port';

export const ASK_RECEIVED_TYPE = 'notifications.ask_received';
export const ASK_ANSWERED_TYPE = 'notifications.ask_answered';
export const FEEDBACK_WRITTEN_TYPE = 'notifications.feedback_written';

/**
 * Optional: an Ask's Givers are sent none unless their answer goes on the feed, and a message
 * enqueued before the audience was sent has none either. A value this release does not know reads
 * as none too, rather than refusing the message: refusing would lose the whole notification, bell
 * line and chat message, over an icon. Any of these is recorded without one.
 */
const audience = z.enum(NOTIFICATION_AUDIENCES).optional().catch(undefined);

const askReceivedPayload = z.object({
  workspaceId: z.string().min(1),
  actorAccountId: z.string().min(1),
  audience,
  giverAccountIds: z.array(z.string().min(1)),
  /**
   * The one payload here that carries words, and only because a chat message says what was
   * asked about. The bell carries none of it (design 0022 D3), and the row this becomes stores
   * ids alone.
   */
  requestMessage: z.string(),
  askIdByGiver: z.record(z.string().min(1), z.string().min(1)),
});

const askAnsweredPayload = z.object({
  workspaceId: z.string().min(1),
  actorAccountId: z.string().min(1),
  audience,
  requesterAccountId: z.string().min(1),
  feedbackRequestId: z.string().min(1),
});

const feedbackWrittenPayload = z.object({
  workspaceId: z.string().min(1),
  actorAccountId: z.string().min(1),
  audience,
  receiverAccountIds: z.array(z.string().min(1)),
  sharedWithAccountIds: z.array(z.string().min(1)),
  feedbackId: z.string().min(1),
});

/**
 * Five, where the channel announcement gets one (ADR 0076 D7).
 *
 * The opposite trade, for the opposite reason: a `notification` row is unique on
 * `(recipientAccountId, type, subjectId)`, so writing it twice is a no-op and a retry is pure
 * gain. What this slice removes is a line that read "a lost Notification is accepted" — the
 * person was told by nothing, and nobody knew.
 */
const MAX_ATTEMPTS = 5;

/**
 * Drains what the outbox holds for one person's bell and their linked chat tools.
 *
 * It calls the same published port Feedback used to call directly, so what a person is told,
 * and through which channels, stays Notifications' business and is unchanged by this.
 */
@Injectable()
export class PersonNotificationOutboxHandler extends OutboxHandler {
  readonly maxAttempts = MAX_ATTEMPTS;

  constructor(private readonly personNotifier: PersonNotifierPort) {
    super();
  }

  async handle(message: OutboxMessageRead): Promise<void> {
    switch (message.type) {
      case ASK_RECEIVED_TYPE:
        return this.personNotifier.askReceived(
          parse(askReceivedPayload, message),
        );
      case ASK_ANSWERED_TYPE:
        return this.personNotifier.askAnswered(
          parse(askAnsweredPayload, message),
        );
      case FEEDBACK_WRITTEN_TYPE:
        return this.personNotifier.feedbackWritten(
          parse(feedbackWrittenPayload, message),
        );
      default:
        // Only reachable if the wiring claims a type this handler does not know — a mistake no
        // retry can fix.
        throw new UnprocessableOutboxMessage(
          `${message.type} is not a notification`,
        );
    }
  }
}

/**
 * A payload this handler cannot read is unprocessable, never retried: it was written by a
 * version whose shape this one does not understand, and asking again returns the same bytes.
 */
function parse<T>(schema: z.ZodType<T>, message: OutboxMessageRead): T {
  const parsed = schema.safeParse(message.payload);
  if (!parsed.success) {
    throw new UnprocessableOutboxMessage(
      `${message.type} payload did not parse`,
    );
  }
  return parsed.data;
}
