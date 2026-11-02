import type {
  PersonalItem,
  PersonalItemOnTheWire,
  PersonalItemsPage,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-item.type';
import { toPostcardWriter } from '@/app/(signed-in)/(brand-new)/_lib/postcard-writer.util';
import {
  toAskOnPostcard,
  toGivenPostcard,
} from '@/app/(signed-in)/(brand-new)/_lib/read-postcard.util';
import { toReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.util';
import type { ReadPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import { toHomeFeedItem } from '@/lib/feedback/home-feed-item.util';

type FeedbackOnTheWire = Extract<PersonalItemOnTheWire, { kind: 'FEEDBACK' }>;

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

/** One thing in a Member's own list, as both views of Received and Given show it. */
export function toPersonalItem(
  item: PersonalItemOnTheWire,
): PersonalItem | null {
  if (item.kind === 'KUDOS') {
    return { kind: item.kind, ...toReadKudos(item) };
  }
  const card = toPostcard(item);
  return card && { kind: item.kind, ...toHomeFeedItem(item), card };
}

/** One page of a Member's own list as the API sends it, leaving out what cannot be drawn. */
export function toPersonalItemsPage(page: {
  readonly readerAccountId: string;
  readonly items: readonly PersonalItemOnTheWire[];
  readonly nextCursor: string | null;
}): PersonalItemsPage {
  return {
    readerAccountId: page.readerAccountId,
    items: page.items.flatMap((item) => toPersonalItem(item) ?? []),
    nextCursor: page.nextCursor,
  };
}
