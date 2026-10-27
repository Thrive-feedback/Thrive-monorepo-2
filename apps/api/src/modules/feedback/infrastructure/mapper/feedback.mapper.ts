import type {
  FeedbackMention as FeedbackMentionRecord,
  FeedbackReceiver as FeedbackReceiverRecord,
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
    // Only an older API reads this column, mid-deploy (ADR 0061): every Receiver is in
    // `feedback_receiver`, and a piece always has at least one.
    receiverAccountId: snapshot.receiverAccountIds[0] ?? '',
    visibility: snapshot.visibility as FeedbackRecord['visibility'],
    message: snapshot.message,
  };
}

/** One row per Receiver, in the order the Giver chose them. */
function toFeedbackReceiverRecords(
  feedback: Feedback,
): Omit<FeedbackReceiverRecord, 'feedbackId'>[] {
  return feedback
    .snapshot()
    .receiverAccountIds.map((accountId, position) => ({ accountId, position }));
}

/** One row per Member selected to read it. */
function toFeedbackSelectedPersonRecords(
  feedback: Feedback,
): Omit<FeedbackSelectedPersonRecord, 'feedbackId'>[] {
  return feedback
    .snapshot()
    .selectedAccountIds.map((accountId) => ({ accountId }));
}

/** One row per Workspace Goal its Giver named. */
function toFeedbackWorkspaceGoalRecords(
  feedback: Feedback,
): Omit<FeedbackWorkspaceGoalRecord, 'feedbackId'>[] {
  return feedback.snapshot().workspaceGoals.map((workspaceGoal) => ({
    workspaceGoalId: workspaceGoal.workspaceGoalId,
    name: workspaceGoal.name,
  }));
}

/** One row per Member its Giver mentioned. */
function toFeedbackMentionRecords(
  feedback: Feedback,
): Omit<FeedbackMentionRecord, 'feedbackId'>[] {
  return feedback.snapshot().mentions.map((mention) => ({
    accountId: mention.accountId,
    slug: mention.slug,
    displayName: mention.displayName,
  }));
}

/**
 * Everything one piece of Feedback is stored as, for one `create`: the row with its Receivers,
 * the people selected to read it and what it names. Both ways Feedback is written — offered, and
 * answering an Ask — store it through this, so neither can leave a part behind: until its
 * Receivers are added, a piece is for nobody.
 */
export function toFeedbackCreateData(feedback: Feedback) {
  return {
    ...toFeedbackRecord(feedback),
    receivers: { create: toFeedbackReceiverRecords(feedback) },
    selectedPeople: { create: toFeedbackSelectedPersonRecords(feedback) },
    workspaceGoals: { create: toFeedbackWorkspaceGoalRecords(feedback) },
    mentions: { create: toFeedbackMentionRecords(feedback) },
  };
}
