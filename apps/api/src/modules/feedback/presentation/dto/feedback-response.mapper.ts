import type {
  FeedbackView,
  PersonView,
  TagsView,
} from '../../application/types/feedback-request.types';
import type {
  AnswerPostcardSnapshot,
  PostcardSnapshot,
} from '../../domain/value-object/postcard.vo';

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

/** How the words on a card are set and the stickers on it, on the wire. */
function toWritingResponse(postcard: AnswerPostcardSnapshot) {
  return {
    textStyle: {
      font: postcard.textStyle.font,
      sizeStep: postcard.textStyle.sizeStep,
      align: postcard.textStyle.align,
      ink: postcard.textStyle.ink,
    },
    stickers: postcard.stickers.map((sticker) => ({
      stickerKey: sticker.stickerKey,
      side: sticker.side,
      x: sticker.x,
      y: sticker.y,
      scale: sticker.scale,
      rotation: sticker.rotation,
    })),
  };
}

/** What an answer decided about how it looks, on the wire. */
export function toAnswerPostcardResponse(
  postcard: AnswerPostcardSnapshot | null,
) {
  return postcard && toWritingResponse(postcard);
}

/** How a card looks, on the wire. `null` for what was not written on a postcard. */
export function toPostcardResponse(postcard: PostcardSnapshot | null) {
  return (
    postcard && {
      ...toWritingResponse(postcard),
      templateKey: postcard.templateKey,
      tone: postcard.tone,
      stampKey: postcard.stampKey,
    }
  );
}

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
    giver: {
      accountId: feedback.giverAccountId,
      name: feedback.giverName,
      photoUrl: feedback.giverPhotoUrl,
      status: feedback.giverStatus,
    },
    receivers: feedback.receivers.map(toPersonResponse),
    message: feedback.message,
    tags: toTagsResponse(feedback.tags),
    createdAt: feedback.createdAt.toISOString(),
  };
}
