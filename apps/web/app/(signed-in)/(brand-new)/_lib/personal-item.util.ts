import type {
  PersonalItem,
  PersonalItemOnTheWire,
  PersonalItemsPage,
  PersonalListItem,
  PersonalRequest,
  PersonalRequestOnTheWire,
} from '@/app/(signed-in)/(brand-new)/_lib/personal-item.type';
import { toPostcardWriter } from '@/app/(signed-in)/(brand-new)/_lib/postcard-writer.util';
import {
  toAskOnPostcard,
  toGivenPostcard,
} from '@/app/(signed-in)/(brand-new)/_lib/read-postcard.util';
import { toReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.util';
import type { ReadPostcard } from '@/components/organisms/postcard-dialog/postcard-read.type';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import {
  toHomeFeedItem,
  toHomeFeedPerson,
} from '@/lib/feedback/home-feed-item.util';

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

/** A request the Member sent, with each answer on the postcard its Giver sent back. */
function toPersonalRequest(item: PersonalRequestOnTheWire): PersonalRequest {
  const ask = toAskOnPostcard(item);
  return {
    kind: item.kind,
    id: item.id,
    message: item.message,
    messageTags: item.tags,
    visibility: item.visibility,
    sentAt: item.createdAt,
    card: {
      kind: 'asked',
      ask,
      messageTags: item.tags,
      sentOn: item.createdAt,
    },
    asked: item.asked.map(({ person, status, answer }) => ({
      person: toHomeFeedPerson(person),
      status,
      answer: answer && {
        id: answer.id,
        message: answer.message,
        messageTags: answer.tags,
        answeredAt: answer.answeredAt,
        card: {
          kind: 'ask',
          ask,
          messageTags: item.tags,
          answers: [
            {
              giver: toPostcardWriter(person),
              message: answer.message,
              messageTags: answer.tags,
              stickers: answer.postcard?.stickers ?? [],
              textStyle: answer.postcard?.textStyle ?? DEFAULT_TEXT_STYLE,
              sentOn: answer.answeredAt,
            },
          ],
        },
      },
    })),
  };
}

/** One thing in a Member's own list, as both views of Received and Given show it. */
export function toPersonalItem(
  item: PersonalItemOnTheWire,
): PersonalListItem | null {
  if (item.kind === 'REQUEST') {
    return toPersonalRequest(item);
  }
  if (item.kind === 'KUDOS') {
    return { kind: item.kind, ...toReadKudos(item) };
  }
  const card = toPostcard(item);
  const feedback: PersonalItem | null = card && {
    kind: item.kind,
    ...toHomeFeedItem(item),
    card,
  };
  return feedback;
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
