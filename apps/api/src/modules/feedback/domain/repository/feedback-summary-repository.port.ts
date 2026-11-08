import type {
  FeedbackSummary,
  FeedbackSummarySnapshot,
} from '../entity/feedback-summary.entity';

export abstract class FeedbackSummaryRepository {
  /**
   * Stores the summary of one Member's period, replacing whatever stood there. Replacing rather
   * than appending because a summary is derived: the old one has no reader once a newer one
   * exists, and the period keeps the history that matters.
   */
  abstract save(summary: FeedbackSummary): Promise<void>;

  /** The stored summary of one Member's period, or `null` when none was written yet. */
  abstract find(
    accountId: string,
    workspaceId: string,
    period: string,
  ): Promise<FeedbackSummarySnapshot | null>;
}
