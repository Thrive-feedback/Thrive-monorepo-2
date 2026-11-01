import type { components } from '@repo/api';
import { toPostcardWriter } from '@/app/(signed-in)/(brand-new)/_lib/postcard-writer.util';
import type { PostcardAsk } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { GivenPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { toFeedbackPerson } from '@/lib/feedback/feedback-person.util';
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
