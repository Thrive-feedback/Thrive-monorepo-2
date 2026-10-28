import type { components } from '@repo/api';
import { toAnsweredRequest } from './answered-request.util';
import type { FeedItem } from './feed-item.type';
import { toFeedbackPerson } from './feedback-person.util';

/**
 * One piece of Feedback as the feed, Shared with me and the route that opens one piece send it.
 * Only the lists carry the request an answer responds to.
 */
type FeedbackOnTheWire =
  | components['schemas']['ListWorkspaceFeedResponseDto_Output']['items'][number]
  | components['schemas']['ListSharedFeedbackResponseDto_Output']['items'][number]
  | components['schemas']['GetFeedbackResponseDto_Output'];

/** One piece of Feedback off the wire, as a card shows it, with whoever is reading named "you". */
export function toFeedItem(
  feedback: FeedbackOnTheWire,
  viewerAccountId: string | null,
): FeedItem {
  return {
    id: feedback.id,
    giverName: feedback.giver.name,
    giverPhotoUrl: feedback.giver.photoUrl,
    giverInactive: feedback.giver.status === 'DEACTIVATED',
    giverIsYou: feedback.giver.accountId === viewerAccountId,
    receivers: feedback.receivers.map((person) =>
      toFeedbackPerson(person, viewerAccountId),
    ),
    origin: feedback.origin,
    message: feedback.message,
    messageTags: feedback.tags,
    givenAt: feedback.createdAt,
    // Reactions are #92; until then a card shows the four with nobody behind them.
    reactions: {},
    request: toAnsweredRequest(
      'request' in feedback ? feedback.request : null,
      viewerAccountId,
    ),
  };
}
