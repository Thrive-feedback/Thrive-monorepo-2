import type {
  FeedbackMention as FeedbackMentionRecord,
  Feedback as FeedbackRecord,
  FeedbackSelectedPerson as FeedbackSelectedPersonRecord,
  FeedbackWorkspaceGoal as FeedbackWorkspaceGoalRecord,
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

/** One row per Workspace Goal its Giver named. */
export function toFeedbackWorkspaceGoalRecords(
  feedback: Feedback,
): Omit<FeedbackWorkspaceGoalRecord, 'feedbackId'>[] {
  return feedback.snapshot().workspaceGoals.map((workspaceGoal) => ({
    workspaceGoalId: workspaceGoal.workspaceGoalId,
    name: workspaceGoal.name,
  }));
}

/** One row per Member its Giver mentioned. */
export function toFeedbackMentionRecords(
  feedback: Feedback,
): Omit<FeedbackMentionRecord, 'feedbackId'>[] {
  return feedback.snapshot().mentions.map((mention) => ({
    accountId: mention.accountId,
    slug: mention.slug,
    displayName: mention.displayName,
  }));
}
