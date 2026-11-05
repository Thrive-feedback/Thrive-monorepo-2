import type { components } from '@repo/api';
import { toPostcardWriter } from '@/app/(signed-in)/(brand-new)/_lib/postcard-writer.util';
import type { PostcardAsk } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type {
  GivenPostcard,
  ReadPostcard,
} from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { toFeedbackPerson } from '@/lib/feedback/feedback-person.util';
import type { FeedItemOnTheWire } from '@/lib/feedback/home-feed-item.type';
import { PLAIN_POSTCARD } from './plain-postcard.constant';

type FeedbackOnTheWire = components['schemas']['GetFeedbackResponseDto_Output'];
type RequestOnTheWire = NonNullable<FeedbackOnTheWire['request']>;

/**
 * Feedback given unasked as the postcard it was written on, or `null` with nobody to address it
 * to. The same card whether it is opened or drawn small, so the two cannot disagree.
 */
export function toGivenPostcard(
  feedback: Pick<
    FeedbackOnTheWire,
    'giver' | 'receivers' | 'postcard' | 'message' | 'tags' | 'createdAt'
  >,
): GivenPostcard | null {
  const [receiver, ...others] = feedback.receivers;
  if (!receiver) {
    return null;
  }
  return {
    ...PLAIN_POSTCARD,
    ...feedback.postcard,
    kind: 'give',
    giver: toPostcardWriter(feedback.giver),
    receivers: [toFeedbackPerson(receiver), ...others.map(toFeedbackPerson)],
    message: feedback.message,
    messageTags: feedback.tags,
    sentOn: feedback.createdAt,
  };
}

/** The Ask an answer sits beside, as the left half of the card. */
export function toAskOnPostcard(
  request: Pick<RequestOnTheWire, 'requester' | 'postcard' | 'message'>,
): PostcardAsk {
  return {
    ...PLAIN_POSTCARD,
    ...request.postcard,
    requester: toPostcardWriter(request.requester),
    message: request.message,
  };
}

/**
 * A piece of Feedback on Home or in a Member's own list as the postcard it is on, or `null` with
 * nobody to address it to. Feedback given unasked is a whole card; an answer is half of the card
 * its request was.
 */
export function toFeedbackPostcard(
  item: Pick<
    FeedItemOnTheWire,
    | 'giver'
    | 'receivers'
    | 'postcard'
    | 'message'
    | 'tags'
    | 'createdAt'
    | 'request'
  >,
): ReadPostcard | null {
  const { request } = item;
  if (!request) {
    return toGivenPostcard(item);
  }
  return {
    kind: 'ask',
    ask: toAskOnPostcard(request),
    messageTags: request.tags,
    answers: [
      {
        giver: toPostcardWriter(item.giver),
        message: item.message,
        messageTags: item.tags,
        stickers: request.answerPostcard?.stickers ?? [],
        textStyle: request.answerPostcard?.textStyle ?? DEFAULT_TEXT_STYLE,
        sentOn: item.createdAt,
      },
    ],
  };
}
