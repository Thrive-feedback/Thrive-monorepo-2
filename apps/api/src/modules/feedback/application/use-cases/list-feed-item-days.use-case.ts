import { Clock } from '@app/shared/application/clock.port';
import { Injectable } from '@nestjs/common';
import {
  CalendarDay,
  RecentDays,
} from '../../domain/value-object/calendar-day.vo';
import { FeedbackRequestQuery } from '../query-port/feedback-request.query-port';
import { KudosQuery } from '../query-port/kudos.query-port';
import type { FeedItemDaysView } from '../types/feed-items.types';
import type { FeedItemShow } from '../types/feedback-request.types';

export interface ListFeedItemDaysInput {
  /** The Workspace the caller is a Member of, resolved before this runs. */
  readonly workspaceId: string;
  /** Who is reading: the signed-in caller, always. Never read from the query. */
  readonly readerAccountId: string;
  readonly show: FeedItemShow;
}

/** Home shows a week: today and the six days before it. */
export const HOME_DAYS = 7;

const NO_KUDOS: readonly Date[] = [];

/**
 * A query: how much one Member's Home held on each of the last seven days, today last, and in all,
 * which is what Home's ribbon of days and the sentence over it say (ADR 0095).
 *
 * It counts the rows Home's list pages through, read with the list's own filters, so a count can
 * never name something the reader cannot open: the Visibility is applied in the read (ADR 0044),
 * and Shared with me holds no Kudos (ADR 0090). Today is the server's, on the one clock every
 * calendar is read on, so no browser decides where a day turns.
 */
@Injectable()
export class ListFeedItemDaysUseCase {
  constructor(
    private readonly clock: Clock,
    private readonly feedbackRequestQuery: FeedbackRequestQuery,
    private readonly kudosQuery: KudosQuery,
  ) {}

  async execute(input: ListFeedItemDaysInput): Promise<FeedItemDaysView> {
    const days = RecentDays.endingOn(
      CalendarDay.containing(this.clock.now()),
      HOME_DAYS,
    );
    const within = days.range();
    const [feedback, kudos] = await Promise.all([
      this.feedbackRequestQuery.feedItemMomentsIn(
        input.workspaceId,
        input.readerAccountId,
        input.show,
        within,
      ),
      input.show === 'SHARED_WITH_ME'
        ? NO_KUDOS
        : this.kudosQuery.onHomeMomentsIn(input.workspaceId, within),
    ]);
    const counted = days.count(feedback, kudos);
    return {
      days: counted,
      totals: counted.reduce(
        (totals, day) => ({
          offeredFeedback: totals.offeredFeedback + day.offeredFeedback,
          requestedFeedback: totals.requestedFeedback + day.requestedFeedback,
          kudos: totals.kudos + day.kudos,
        }),
        { offeredFeedback: 0, requestedFeedback: 0, kudos: 0 },
      ),
    };
  }
}
