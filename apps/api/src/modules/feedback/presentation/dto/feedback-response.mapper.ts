import type {
  FeedbackView,
  PersonView,
  TagsView,
} from '../../application/types/feedback-request.types';

/** One person a piece of Feedback names, on the wire. */
export function toPersonResponse(person: PersonView) {
  return {
    accountId: person.accountId,
    name: person.name,
    photoUrl: person.photoUrl,
    status: person.status,
  };
}

/** What some sent text was bound to, on the wire. Shared by every route that shows sent text. */
export function toTagsResponse(tags: TagsView) {
  return {
    workspaceGoals: tags.workspaceGoals.map((workspaceGoal) => ({
      name: workspaceGoal.name,
    })),
    mentions: tags.mentions.map((mention) => ({
      slug: mention.slug,
      displayName: mention.displayName,
    })),
  };
}

/**
 * One piece of Feedback on the wire, the same for every reader its Visibility lets in, with its
 * date written as the contract declares it. Shared by the route that opens one piece and the
 * lists that show the pieces a reader may see.
 */
export function toFeedbackResponse(feedback: FeedbackView) {
  // Every piece has at least one Receiver: the table refuses none, and Requested has exactly one.
  const [firstReceiver] = feedback.receivers;
  if (!firstReceiver) {
    throw new Error(`Feedback ${feedback.id} has no Receiver.`);
  }
  return {
    id: feedback.id,
    origin: feedback.origin,
    feedbackRequestId: feedback.feedbackRequestId,
    giver: {
      accountId: feedback.giverAccountId,
      name: feedback.giverName,
      photoUrl: feedback.giverPhotoUrl,
      status: feedback.giverStatus,
    },
    receiver: toPersonResponse(firstReceiver),
    receivers: feedback.receivers.map(toPersonResponse),
    message: feedback.message,
    tags: toTagsResponse(feedback.tags),
    createdAt: feedback.createdAt.toISOString(),
  };
}
