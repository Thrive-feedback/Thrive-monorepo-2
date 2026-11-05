import type {
  FeedbackView,
  FeedItemRequestView,
  FeedItemView,
  MyAskView,
  PersonView,
  TagsView,
} from '../../application/types/feedback-request.types';
import type { KudosView } from '../../application/types/kudos.types';
import type {
  PersonalFeedbackView,
  PersonalItemView,
  ReceivedItemView,
} from '../../application/types/personal-item.types';
import type { KudosCardSnapshot } from '../../domain/value-object/kudos-card.vo';
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

/** One Kudos, on the wire, as its own list and Home both carry it. */
export function toKudosResponse(kudos: KudosView) {
  return {
    id: kudos.id,
    giver: toPersonResponse(kudos.giver),
    recipients: kudos.recipients.map(toPersonResponse),
    message: kudos.message,
    tags: toTagsResponse(kudos.tags),
    card: toKudosCardResponse(kudos.card),
    createdAt: kudos.createdAt.toISOString(),
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

/** How a Kudos card looks, on the wire. `null` when there is no card to draw. */
export function toKudosCardResponse(card: KudosCardSnapshot | null) {
  return (
    card && {
      templateKey: card.templateKey,
      textStyle: {
        font: card.textStyle.font,
        sizeStep: card.textStyle.sizeStep,
        align: card.textStyle.align,
        ink: card.textStyle.ink,
      },
      stickers: card.stickers.map((sticker) => ({
        stickerKey: sticker.stickerKey,
        x: sticker.x,
        y: sticker.y,
        scale: sticker.scale,
        rotation: sticker.rotation,
      })),
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

/** The request an answer responds to, everyone it asked and the card it is on, on the wire. */
export function toFeedItemRequestResponse(request: FeedItemRequestView) {
  return {
    message: request.message,
    tags: toTagsResponse(request.tags),
    requester: toPersonResponse(request.requester),
    asked: request.asked.map((ask) => ({
      person: toPersonResponse(ask.person),
      status: ask.status,
      answer: ask.answer && {
        message: ask.answer.message,
        tags: toTagsResponse(ask.answer.tags),
        answeredAt: ask.answer.answeredAt.toISOString(),
      },
    })),
    postcard: toPostcardResponse(request.postcard),
    answerPostcard: toAnswerPostcardResponse(request.answerPostcard),
  };
}

/**
 * One piece of Feedback on Home or in a Member's own list, with the card it is on, on the wire. The
 * caller adds its Visibility, which Home declares narrower than a Member's own list.
 */
export function toFeedItemResponse(item: FeedItemView | PersonalFeedbackView) {
  return {
    kind: item.kind,
    ...toFeedbackResponse(item),
    postcard: toPostcardResponse(item.postcard),
    request: item.request && toFeedItemRequestResponse(item.request),
  };
}

/** One thing in a Member's own list, Received or Given, on the wire. */
export function toPersonalItemResponse(item: PersonalItemView) {
  if (item.kind === 'KUDOS') {
    return { kind: item.kind, ...toKudosResponse(item) };
  }
  return { ...toFeedItemResponse(item), visibility: item.visibility };
}

/** One thing in the caller's Received on the wire, a request among them. */
export function toReceivedItemResponse(item: ReceivedItemView) {
  if (item.kind !== 'REQUEST') {
    return toPersonalItemResponse(item);
  }
  return {
    kind: item.kind,
    id: item.id,
    message: item.message,
    tags: toTagsResponse(item.tags),
    visibility: item.visibility,
    requester: toPersonResponse(item.requester),
    selectedPeople: item.selectedPeople.map(toPersonResponse),
    postcard: toPostcardResponse(item.postcard),
    createdAt: item.createdAt.toISOString(),
    latestActivityAt: item.latestActivityAt.toISOString(),
    asked: item.asked.map((ask) => ({
      person: toPersonResponse(ask.person),
      status: ask.status,
      answer: ask.answer && {
        id: ask.answer.id,
        message: ask.answer.message,
        tags: toTagsResponse(ask.answer.tags),
        postcard: toAnswerPostcardResponse(ask.answer.postcard),
        answeredAt: ask.answer.answeredAt.toISOString(),
      },
    })),
  };
}

/** One Ask on the wire, with its dates written as the contract declares them. */
export function toFeedbackAskResponse(ask: MyAskView) {
  return {
    askId: ask.askId,
    feedbackRequestId: ask.feedbackRequestId,
    message: ask.message,
    tags: toTagsResponse(ask.tags),
    requester: {
      accountId: ask.requesterAccountId,
      name: ask.requesterName,
      photoUrl: ask.requesterPhotoUrl,
      status: ask.requesterStatus,
    },
    status: ask.status,
    createdAt: ask.createdAt.toISOString(),
  };
}
