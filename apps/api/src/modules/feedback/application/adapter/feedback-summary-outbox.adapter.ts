import {
  OutboxHandler,
  type OutboxMessageRead,
  UnprocessableOutboxMessage,
} from '@app/shared/application/outbox-handler.port';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { RefreshFeedbackSummaryUseCase } from '../use-cases/refresh-feedback-summary.use-case';

export const SUMMARY_REFRESH_TYPE = 'feedback.summary_refresh';

const refreshPayload = z.object({
  workspaceId: z.string().min(1),
  accountId: z.string().min(1),
  period: z.string().min(1),
});

/**
 * Three, as the channel announcement gets one and the bell gets five (ADR 0076 D7).
 *
 * In the middle because the work is idempotent — it replaces a row — so a retry is safe, but
 * each one costs a model call, so retrying forever would be paying repeatedly for an answer
 * nobody is waiting on. The run itself asks the model once (design 0025 D4).
 */
const MAX_ATTEMPTS = 3;

/**
 * Drains the requests to write somebody's summary again.
 *
 * It exists because nothing in this repository runs work on a cadence: there is no scheduler
 * (`BE_18` is `todo`, and `PROJECT.md` §4 has no row for one), so the outbox is the only
 * mechanism that can carry slow work off a request. The seams that enqueue it are the write
 * that made a summary stale and the read that noticed.
 */
@Injectable()
export class FeedbackSummaryOutboxHandler extends OutboxHandler {
  readonly maxAttempts = MAX_ATTEMPTS;

  constructor(private readonly refresh: RefreshFeedbackSummaryUseCase) {
    super();
  }

  async handle(message: OutboxMessageRead): Promise<void> {
    if (message.type !== SUMMARY_REFRESH_TYPE) {
      // Only reachable if the wiring claims a type this handler does not know.
      throw new UnprocessableOutboxMessage(
        `${message.type} is not a summary refresh`,
      );
    }
    const parsed = refreshPayload.safeParse(message.payload);
    if (!parsed.success) {
      // Written by a version whose shape this one does not understand; asking again returns the
      // same bytes.
      throw new UnprocessableOutboxMessage(
        `${message.type} payload did not parse`,
      );
    }
    await this.refresh.execute(parsed.data);
  }
}
