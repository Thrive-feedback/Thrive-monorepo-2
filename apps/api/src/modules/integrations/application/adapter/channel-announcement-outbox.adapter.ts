import {
  OutboxHandler,
  type OutboxMessageRead,
  UnprocessableOutboxMessage,
} from '@app/shared/application/outbox-handler.port';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ChannelAnnouncerPort } from '../port/channel-announcer.port';

/** The type Feedback enqueues under when it shows a piece of Feedback to the whole Workspace. */
export const FEEDBACK_PUBLISHED_TYPE = 'integrations.feedback_published';
/** The type Feedback enqueues under when somebody gives Kudos. */
export const KUDOS_GIVEN_TYPE = 'integrations.kudos_given';

/**
 * Ids only, which is all an outbox payload may carry (ADR 0076). The names the post says are read
 * at delivery, so a Member who changed their display name between the write and the post is
 * announced by the name they have now.
 */
const feedbackPublishedPayload = z.object({
  workspaceId: z.string().min(1),
  giverAccountId: z.string().min(1),
  receiverAccountIds: z.array(z.string().min(1)),
  feedbackId: z.string().min(1),
});

/**
 * A Kudos is the exception that proves the rule: its **message travels**, because a Kudos has no
 * Visibility and is already readable by every Member, and one without its words announces that
 * praise happened somewhere else (brain `ADR-0045`).
 */
const kudosGivenPayload = z.object({
  workspaceId: z.string().min(1),
  giverAccountId: z.string().min(1),
  recipientAccountIds: z.array(z.string().min(1)),
  message: z.string(),
  kudosId: z.string().min(1),
});

/** One attempt. A chat post cannot be taken back, so a retry doubles rather than repairs. */
const MAX_ATTEMPTS = 1;

/**
 * Drains what the outbox holds for a connected channel.
 *
 * **Why one attempt** (ADR 0076 D7): at-least-once is a gain for work that is idempotent and a
 * regression for work that is not. A Discord post has no idempotency key on Discord's side and
 * cannot be unsent (brain `ADR-0040`), so retrying trades "occasionally lost" for "occasionally
 * doubled in front of a room that may hold a client". One attempt keeps the old behaviour and
 * changes what a failure leaves behind: a dead row somebody can see, instead of a log line.
 */
@Injectable()
export class ChannelAnnouncementOutboxHandler extends OutboxHandler {
  readonly maxAttempts = MAX_ATTEMPTS;

  constructor(private readonly channelAnnouncer: ChannelAnnouncerPort) {
    super();
  }

  async handle(message: OutboxMessageRead): Promise<void> {
    if (message.type === FEEDBACK_PUBLISHED_TYPE) {
      return this.channelAnnouncer.feedbackPublished(
        parse(feedbackPublishedPayload, message),
      );
    }
    if (message.type === KUDOS_GIVEN_TYPE) {
      return this.channelAnnouncer.kudosGiven(
        parse(kudosGivenPayload, message),
      );
    }
    // The registry keys by type, so this is only reachable if the wiring claims a type this
    // handler does not know — a mistake no retry can fix.
    throw new UnprocessableOutboxMessage(
      `${message.type} is not an announcement`,
    );
  }
}

/**
 * A payload this handler cannot read is unprocessable, never retried: it was written by a version
 * whose shape this one does not understand, and asking again returns the same bytes. ADR 0076
 * ships a breaking payload change as a new `type` precisely so that this stays rare.
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
