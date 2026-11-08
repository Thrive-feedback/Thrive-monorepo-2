import { Clock } from '@app/shared/application/clock.port';
import { Outbox } from '@app/shared/application/outbox.port';
import { UnitOfWork } from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import type { FeedbackSummarySnapshot } from '../../domain/entity/feedback-summary.entity';
import { FeedbackSummaryRepository } from '../../domain/repository/feedback-summary-repository.port';
import { SummaryPeriod } from '../../domain/value-object/summary-period.vo';
import { SUMMARY_REFRESH_TYPE } from '../adapter/feedback-summary-outbox.adapter';
import { SummaryCorpusQuery } from '../query-port/summary-corpus.query-port';
import { SUMMARY_PROMPT_VERSION } from '../service/summary-prompt.service';
import { summaryRefreshKey } from '../service/summary-refresh-key.service';
import { SUMMARY_SOURCE_FLOOR } from './refresh-feedback-summary.use-case';

export interface GetMyFeedbackSummaryInput {
  readonly workspaceId: string;
  /** The signed-in caller, always. The route cannot name anybody else (design 0025 D8). */
  readonly accountId: string;
  /** The period asked for, or `null` for the one today falls in. */
  readonly period: string | null;
}

export interface MyFeedbackSummary extends FeedbackSummarySnapshot {
  /** Whether Feedback has arrived since this was written. The page says so rather than hiding it. */
  readonly isStale: boolean;
}

/**
 * Reads the caller's own summary of one period, and asks for a new one when what stands is
 * behind.
 *
 * Nothing is generated here: the answer is whatever was stored, and the regeneration is
 * enqueued (design 0025 D4). A Member who opens the page before the first one exists is told
 * there is nothing yet, and the request they just made is what starts it being written.
 */
@Injectable()
export class GetMyFeedbackSummaryUseCase {
  constructor(
    private readonly summaries: FeedbackSummaryRepository,
    private readonly corpus: SummaryCorpusQuery,
    private readonly outbox: Outbox,
    private readonly clock: Clock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    input: GetMyFeedbackSummaryInput,
  ): Promise<MyFeedbackSummary | null> {
    const period =
      input.period === null
        ? SummaryPeriod.containing(this.clock.now())
        : SummaryPeriod.of(input.period);

    const [stored, freshness] = await Promise.all([
      this.summaries.find(
        input.accountId,
        input.workspaceId,
        period.toString(),
      ),
      this.corpus.freshnessOf(
        input.workspaceId,
        input.accountId,
        period.range(),
      ),
    ]);

    const newest = freshness.newest;
    const worthWriting = freshness.count >= SUMMARY_SOURCE_FLOOR;
    const isStale =
      stored !== null &&
      newest !== null &&
      newest.createdAt > stored.sourceWatermark;
    // A summary an older prompt wrote is out of date even where no Feedback has arrived since,
    // and so is one whose stored shape this version could not read — which arrives here as no
    // summary at all. Neither is anything a Member should be told about; both are work to do.
    const writtenByAnOlderPrompt =
      stored !== null && stored.promptVersion !== SUMMARY_PROMPT_VERSION;

    if (
      newest !== null &&
      worthWriting &&
      (stored === null || isStale || writtenByAnOlderPrompt)
    ) {
      await this.askForOne(input, period.toString(), newest.id);
    }

    return stored === null ? null : { ...stored, isStale };
  }

  /**
   * A unit of work on a read path, and deliberately: the outbox refuses an enqueue outside the
   * transaction it belongs to, which is the rule that keeps a promise to do something from
   * being recorded when the thing itself rolled back. There is nothing else in this
   * transaction, so it costs one short write.
   *
   * The key is `summaryRefreshKey`'s, which is also what the write path asks with, so a write
   * and the read that follows it cost one generation between them (ADR 0084).
   */
  private async askForOne(
    input: GetMyFeedbackSummaryInput,
    period: string,
    newestSourceId: string,
  ): Promise<void> {
    await this.unitOfWork.run(async () => {
      await this.outbox.enqueue([
        {
          type: SUMMARY_REFRESH_TYPE,
          idempotencyKey: summaryRefreshKey(input.accountId, newestSourceId),
          payload: {
            workspaceId: input.workspaceId,
            accountId: input.accountId,
            period,
          },
        },
      ]);
    });
  }
}
