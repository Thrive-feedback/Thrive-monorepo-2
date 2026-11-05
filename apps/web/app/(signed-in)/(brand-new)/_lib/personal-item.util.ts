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
  toFeedbackPostcard,
} from '@/app/(signed-in)/(brand-new)/_lib/read-postcard.util';
import { toReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { DEFAULT_TEXT_STYLE } from '@/components/organisms/postcard-dialog/postcard-style.constant';
import {
  toHomeFeedItem,
  toHomeFeedPerson,
} from '@/lib/feedback/home-feed-item.util';

/** A request the Member sent, with each answer on the postcard its Giver sent back. */
function toPersonalRequest(item: PersonalRequestOnTheWire): PersonalRequest {
  const ask = toAskOnPostcard(item);
  return {
    kind: item.kind,
    id: item.id,
    message: item.message,
    messageTags: item.tags,
    visibility: item.visibility,
    requester: toHomeFeedPerson(item.requester),
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
  const card = toFeedbackPostcard(item);
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
