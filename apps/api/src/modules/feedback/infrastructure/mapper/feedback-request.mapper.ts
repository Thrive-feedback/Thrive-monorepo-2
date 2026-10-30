import type {
  FeedbackAsk as FeedbackAskRecord,
  FeedbackRequestMention as FeedbackRequestMentionRecord,
  FeedbackRequest as FeedbackRequestRecord,
  FeedbackRequestSelectedPerson as FeedbackRequestSelectedPersonRecord,
  FeedbackRequestWorkspaceGoal as FeedbackRequestWorkspaceGoalRecord,
} from '@app/infrastructure/database/generated/client';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import { toPostcardRecord, toPostcardSnapshot } from './postcard.mapper';

/** The only place that knows both the stored rows and the FeedbackRequest aggregate. */

type StoredRequest = FeedbackRequestRecord & {
  readonly asks: readonly FeedbackAskRecord[];
  readonly selectedPeople: readonly FeedbackRequestSelectedPersonRecord[];
  readonly workspaceGoals: readonly FeedbackRequestWorkspaceGoalRecord[];
  readonly mentions: readonly FeedbackRequestMentionRecord[];
};

export function toFeedbackRequest(record: StoredRequest): FeedbackRequest {
  return FeedbackRequest.restore({
    id: record.id,
    workspaceId: record.workspaceId,
    requesterAccountId: record.requesterAccountId,
    message: record.message,
    postcard: toPostcardSnapshot(record.postcard),
    visibility: record.visibility,
    selectedAccountIds: record.selectedPeople.map((person) => person.accountId),
    workspaceGoals: record.workspaceGoals.map((workspaceGoal) => ({
      workspaceGoalId: workspaceGoal.workspaceGoalId,
      name: workspaceGoal.name,
    })),
    mentions: record.mentions.map((mention) => ({
      accountId: mention.accountId,
      slug: mention.slug,
      displayName: mention.displayName,
    })),
    asks: record.asks.map((ask) => ({
      id: ask.id,
      giverAccountId: ask.giverAccountId,
      status: ask.status,
    })),
  });
}

/** The audit timestamps are the database's to set. */
export function toFeedbackRequestRecord(request: FeedbackRequest): Omit<
  FeedbackRequestRecord,
  'createdAt' | 'updatedAt' | 'postcard'
> & {
  readonly postcard: ReturnType<typeof toPostcardRecord>;
  readonly asks: readonly Omit<
    FeedbackAskRecord,
    'createdAt' | 'updatedAt' | 'feedbackRequestId'
  >[];
  readonly selectedPeople: readonly Omit<
    FeedbackRequestSelectedPersonRecord,
    'feedbackRequestId'
  >[];
  readonly workspaceGoals: readonly Omit<
    FeedbackRequestWorkspaceGoalRecord,
    'feedbackRequestId'
  >[];
  readonly mentions: readonly Omit<
    FeedbackRequestMentionRecord,
    'feedbackRequestId'
  >[];
} {
  const snapshot = request.snapshot();
  return {
    id: snapshot.id,
    workspaceId: snapshot.workspaceId,
    requesterAccountId: snapshot.requesterAccountId,
    message: snapshot.message,
    postcard: toPostcardRecord(snapshot.postcard),
    visibility: snapshot.visibility as FeedbackRequestRecord['visibility'],
    asks: snapshot.asks.map((ask) => ({
      id: ask.id,
      giverAccountId: ask.giverAccountId,
      status: ask.status as FeedbackAskRecord['status'],
    })),
    selectedPeople: snapshot.selectedAccountIds.map((accountId) => ({
      accountId,
    })),
    workspaceGoals: snapshot.workspaceGoals.map((workspaceGoal) => ({
      workspaceGoalId: workspaceGoal.workspaceGoalId,
      name: workspaceGoal.name,
    })),
    mentions: snapshot.mentions.map((mention) => ({
      accountId: mention.accountId,
      slug: mention.slug,
      displayName: mention.displayName,
    })),
  };
}
