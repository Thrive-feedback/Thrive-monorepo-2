import { toFeedbackPerson } from './feedback-person.util';
import type {
  FeedItemOnTheWire,
  HomeFeedItem,
  HomeFeedPerson,
} from './home-feed-item.type';

export function toHomeFeedPerson(
  person: Pick<
    FeedItemOnTheWire['giver'],
    'accountId' | 'name' | 'photoUrl' | 'status'
  >,
): HomeFeedPerson {
  return { accountId: person.accountId, ...toFeedbackPerson(person) };
}

/**
 * A piece of Feedback as the API sends it, as a card shows it, on Home and wherever else. The
 * postcard it is on is the caller's to add, from the card it was written on.
 */
export function toHomeFeedItem(
  feedback: Omit<FeedItemOnTheWire, 'visibility'> &
    Pick<HomeFeedItem, 'visibility'>,
): Omit<HomeFeedItem, 'card'> {
  return {
    id: feedback.id,
    origin: feedback.origin,
    giver: toHomeFeedPerson(feedback.giver),
    receivers: feedback.receivers.map(toHomeFeedPerson),
    message: feedback.message,
    messageTags: feedback.tags,
    givenAt: feedback.createdAt,
    visibility: feedback.visibility,
    request: feedback.request && {
      message: feedback.request.message,
      messageTags: feedback.request.tags,
      requester: toHomeFeedPerson(feedback.request.requester),
      asked: feedback.request.asked.map((ask) => ({
        person: toHomeFeedPerson(ask.person),
        status: ask.status,
        answer: ask.answer && {
          message: ask.answer.message,
          messageTags: ask.answer.tags,
        },
      })),
    },
  };
}
