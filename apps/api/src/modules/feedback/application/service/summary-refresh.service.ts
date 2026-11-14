import { Clock } from '@app/shared/application/clock.port';
import { Outbox } from '@app/shared/application/outbox.port';
import { Injectable } from '@nestjs/common';
import { SummaryPeriod } from '../../domain/value-object/summary-period.vo';
import { SUMMARY_REFRESH_TYPE } from '../adapter/feedback-summary-outbox.adapter';
import { summaryRefreshKey } from './summary-refresh-key.service';

/**
 * How many summaries one write may ask for.
 *
 * A piece of Feedback may name up to fifty Receivers, and each one's summary costs a model call —
 * so one request could buy fifty of them, and nothing stops a caller repeating the request. The
 * cap bounds what any single write can spend.
 *
 * **Nobody loses a summary to it.** This path is an optimisation: it warms a summary before the
 * Member looks. The read path is the guarantee — opening the dashboard asks for one whenever what
 * is stored has fallen behind — so a Receiver past the cap gets theirs written the moment they go
 * looking for it, one generation later than the rest.
 */
const MAX_SUMMARIES_PER_WRITE = 10;

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
   * (ADR 0084). At most {@link MAX_SUMMARIES_PER_WRITE} are asked for here; the rest are the
   * read path's to notice.
   */
  async askFor(details: {
    readonly workspaceId: string;
    readonly accountIds: readonly string[];
    readonly sourceId: string;
  }): Promise<void> {
    const period = SummaryPeriod.containing(this.clock.now()).toString();
    await this.outbox.enqueue(
      details.accountIds.slice(0, MAX_SUMMARIES_PER_WRITE).map((accountId) => ({
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
