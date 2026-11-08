import {
  type SummaryCorpusFreshness,
  SummaryCorpusQuery,
  type SummarySourceRow,
} from '@app/modules/feedback/application/query-port/summary-corpus.query-port';
import type {
  FeedbackSummary,
  FeedbackSummarySnapshot,
} from '@app/modules/feedback/domain/entity/feedback-summary.entity';
import { FeedbackSummaryRepository } from '@app/modules/feedback/domain/repository/feedback-summary-repository.port';
import type { SummaryPeriodRange } from '@app/modules/feedback/domain/value-object/summary-period.vo';

/** Keyed as the unique index is, so a second save of one period replaces the first. */
export class FakeFeedbackSummaryRepository extends FeedbackSummaryRepository {
  private readonly stored = new Map<string, FeedbackSummarySnapshot>();

  async save(summary: FeedbackSummary): Promise<void> {
    const written = summary.snapshot();
    this.stored.set(
      keyOf(written.accountId, written.workspaceId, written.period),
      written,
    );
  }

  async find(
    accountId: string,
    workspaceId: string,
    period: string,
  ): Promise<FeedbackSummarySnapshot | null> {
    return this.stored.get(keyOf(accountId, workspaceId, period)) ?? null;
  }

  /** Ages what is stored, so a spec can read a summary an older prompt wrote. */
  pretendWrittenBy(promptVersion: number): void {
    for (const [key, written] of this.stored) {
      this.stored.set(key, { ...written, promptVersion });
    }
  }

  /** What a spec asserts against, without going through `find`'s arguments again. */
  only(): FeedbackSummarySnapshot | undefined {
    return [...this.stored.values()][0];
  }

  count(): number {
    return this.stored.size;
  }
}

function keyOf(accountId: string, workspaceId: string, period: string): string {
  return `${accountId}:${workspaceId}:${period}`;
}

/** Holds one corpus, whatever period is asked for: a spec sets what the Member received. */
export class FakeSummaryCorpusQuery extends SummaryCorpusQuery {
  private rows: readonly SummarySourceRow[] = [];

  with(...rows: readonly SummarySourceRow[]): this {
    this.rows = rows;
    return this;
  }

  async writtenTo(
    _workspaceId: string,
    _accountId: string,
    _within: SummaryPeriodRange,
  ): Promise<readonly SummarySourceRow[]> {
    return this.rows;
  }

  async freshnessOf(
    _workspaceId: string,
    _accountId: string,
    _within: SummaryPeriodRange,
  ): Promise<SummaryCorpusFreshness> {
    const newest = [...this.rows].sort(
      (one, other) => one.createdAt.getTime() - other.createdAt.getTime(),
    )[this.rows.length - 1];
    return {
      count: this.rows.length,
      newest:
        newest === undefined
          ? null
          : { id: newest.id, createdAt: newest.createdAt },
    };
  }
}
