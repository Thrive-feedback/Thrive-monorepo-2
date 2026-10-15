import type {
  Feedback as FeedbackRecord,
  FeedbackSelectedPerson as FeedbackSelectedPersonRecord,
} from '@app/infrastructure/database/generated/client';
import type { Feedback } from '../../domain/entity/feedback.entity';

/** The only place that knows both the stored rows and the Feedback entity. */

/** The audit timestamps are the database's to set. */
export function toFeedbackRecord(
  feedback: Feedback,
): Omit<FeedbackRecord, 'createdAt' | 'updatedAt'> {
  const snapshot = feedback.snapshot();
  return {
    id: snapshot.id,
    workspaceId: snapshot.workspaceId,
    origin: snapshot.origin,
    feedbackRequestId: snapshot.feedbackRequestId,
    feedbackAskId: snapshot.feedbackAskId,
    giverAccountId: snapshot.giverAccountId,
    receiverAccountId: snapshot.receiverAccountId,
    topic: snapshot.topic,
    visibility: snapshot.visibility as FeedbackRecord['visibility'],
    body: snapshot.body,
  };
}

/** One row per Member selected to read it. */
export function toFeedbackSelectedPersonRecords(
  feedback: Feedback,
): Omit<FeedbackSelectedPersonRecord, 'feedbackId'>[] {
  return feedback
    .snapshot()
    .selectedAccountIds.map((accountId) => ({ accountId }));
}
