import type { components } from '@repo/api';
import type { FeedItem } from '@/lib/feedback/feed-item.type';
import { toFeedbackPerson } from '@/lib/feedback/feedback-person.util';

type FeedbackOnTheWire = Pick<
  components['schemas']['GetFeedbackResponseDto_Output'],
  'id' | 'giver' | 'receivers' | 'origin' | 'message' | 'tags' | 'createdAt'
>;

/** One piece of Feedback off the wire, as a card shows it, with no request behind it. */
export function toFeedItem(feedback: FeedbackOnTheWire): FeedItem {
  return {
    id: feedback.id,
    giverName: feedback.giver.name,
    giverPhotoUrl: feedback.giver.photoUrl,
    giverInactive: feedback.giver.status === 'DEACTIVATED',
    receivers: feedback.receivers.map(toFeedbackPerson),
    origin: feedback.origin,
    message: feedback.message,
    messageTags: feedback.tags,
    givenAt: feedback.createdAt,
    // Reactions are #92; until then a card shows the four with nobody behind them.
    reactions: {},
    request: null,
  };
}
