import type {
  FeedbackAsk as FeedbackAskRecord,
  FeedbackRequest as FeedbackRequestRecord,
  FeedbackRequestSelectedPerson as FeedbackRequestSelectedPersonRecord,
} from '@app/infrastructure/database/generated/client';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';

/** The only place that knows both the stored rows and the FeedbackRequest aggregate. */

type StoredRequest = FeedbackRequestRecord & {
  readonly asks: readonly FeedbackAskRecord[];
  readonly selectedPeople: readonly FeedbackRequestSelectedPersonRecord[];
};

export function toFeedbackRequest(record: StoredRequest): FeedbackRequest {
  return FeedbackRequest.restore({
    id: record.id,
    workspaceId: record.workspaceId,
    requesterAccountId: record.requesterAccountId,
    topic: record.topic,
    visibility: record.visibility,
    selectedAccountIds: record.selectedPeople.map((person) => person.accountId),
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
  'createdAt' | 'updatedAt'
> & {
  readonly asks: readonly Omit<
    FeedbackAskRecord,
    'createdAt' | 'updatedAt' | 'feedbackRequestId'
  >[];
  readonly selectedPeople: readonly Omit<
    FeedbackRequestSelectedPersonRecord,
    'feedbackRequestId'
  >[];
} {
  const snapshot = request.snapshot();
  return {
    id: snapshot.id,
    workspaceId: snapshot.workspaceId,
    requesterAccountId: snapshot.requesterAccountId,
    topic: snapshot.topic,
    visibility: snapshot.visibility as FeedbackRequestRecord['visibility'],
    asks: snapshot.asks.map((ask) => ({
      id: ask.id,
      giverAccountId: ask.giverAccountId,
      status: ask.status as FeedbackAskRecord['status'],
    })),
    selectedPeople: snapshot.selectedAccountIds.map((accountId) => ({
      accountId,
    })),
  };
}
