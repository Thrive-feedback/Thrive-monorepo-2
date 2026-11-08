import { Clock } from '@app/shared/application/clock.port';
import { Outbox } from '@app/shared/application/outbox.port';
import { Injectable } from '@nestjs/common';
import { SummaryPeriod } from '../../domain/value-object/summary-period.vo';
import { SUMMARY_REFRESH_TYPE } from '../adapter/feedback-summary-outbox.adapter';
import { summaryRefreshKey } from './summary-refresh-key.service';

/**
 * Asks for the summaries that something just written has made out of date.
 *
 * One place rather than three, because answering an Ask, offering Feedback and giving Kudos all
 * make the same request and would otherwise each spell the key their own way — and the key is
 * what decides whether two of them collapse into one regeneration.
 */
@Injectable()
export class SummaryRefreshService {
  constructor(
    private readonly outbox: Outbox,
    private readonly clock: Clock,
  ) {}

  /**
   * **Call inside the unit of work that wrote `sourceId`.** The outbox refuses an enqueue
   * outside one, which is what keeps the promise to rewrite a summary from outliving a Feedback
   * that rolled back.
   *
   * Keyed by the Member, the item that made their summary stale and the prompt that will write
   * it, so the read path's own request for the same item is the same key and costs nothing
   * (ADR 0084).
   */
  async askFor(details: {
    readonly workspaceId: string;
    readonly accountIds: readonly string[];
    readonly sourceId: string;
  }): Promise<void> {
    const period = SummaryPeriod.containing(this.clock.now()).toString();
    await this.outbox.enqueue(
      details.accountIds.map((accountId) => ({
        type: SUMMARY_REFRESH_TYPE,
        idempotencyKey: summaryRefreshKey(accountId, details.sourceId),
        payload: {
          workspaceId: details.workspaceId,
          accountId,
          period,
        },
      })),
    );
  }
}
