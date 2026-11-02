import { toPostcardWriter } from '@/app/(signed-in)/(brand-new)/_lib/postcard-writer.util';
import {
  toAskOnPostcard,
  toGivenPostcard,
} from '@/app/(signed-in)/(brand-new)/_lib/read-postcard.util';
import { toReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.util';
import type { ReadPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { toHomeFeedItem } from '@/lib/feedback/home-feed-item.util';
import type { ReceivedItem, ReceivedItemOnTheWire } from './received-item.type';

type FeedbackOnTheWire = Extract<ReceivedItemOnTheWire, { kind: 'FEEDBACK' }>;

/** Feedback given unasked is a whole card; an answer is half of the card its request was. */
function toPostcard(item: FeedbackOnTheWire): ReadPostcard | null {
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

/** One thing written to the person, as both views of Received show it. */
export function toReceivedItem(
  item: ReceivedItemOnTheWire,
): ReceivedItem | null {
  if (item.kind === 'KUDOS') {
    return { kind: item.kind, ...toReadKudos(item) };
  }
  const card = toPostcard(item);
  return card && { kind: item.kind, ...toHomeFeedItem(item), card };
}
