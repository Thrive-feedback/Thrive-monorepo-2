import type { Feedback as FeedbackRecord } from '@app/infrastructure/database/generated/client';
import type { Feedback } from '../../domain/entity/feedback.entity';

/** The only place that knows both the stored row and the Feedback entity. */

/** The audit timestamps are the database's to set. */
export function toFeedbackRecord(
  feedback: Feedback,
): Omit<FeedbackRecord, 'createdAt' | 'updatedAt'> {
  const snapshot = feedback.snapshot();
  return {
    id: snapshot.id,
    workspaceId: snapshot.workspaceId,
    feedbackRequestId: snapshot.feedbackRequestId,
    feedbackAskId: snapshot.feedbackAskId,
    giverAccountId: snapshot.giverAccountId,
    receiverAccountId: snapshot.receiverAccountId,
    body: snapshot.body,
  };
}
