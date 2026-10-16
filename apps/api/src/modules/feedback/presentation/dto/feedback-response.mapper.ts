import type { FeedbackView } from '../../application/types/feedback-request.types';

/**
 * One piece of Feedback on the wire, the same for every reader its Visibility lets in, with its
 * date written as the contract declares it. Shared by the route that opens one piece and the
 * lists that show the pieces a reader may see.
 */
export function toFeedbackResponse(feedback: FeedbackView) {
  return {
    id: feedback.id,
    origin: feedback.origin,
    feedbackRequestId: feedback.feedbackRequestId,
    topic: feedback.topic,
    giver: { accountId: feedback.giverAccountId, name: feedback.giverName },
    receiver: {
      accountId: feedback.receiverAccountId,
      name: feedback.receiverName,
    },
    body: feedback.body,
    createdAt: feedback.createdAt.toISOString(),
  };
}
