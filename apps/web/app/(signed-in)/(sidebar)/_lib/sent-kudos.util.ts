import type { KudosDraft } from '@/components/organisms/kudos-dialog/kudos-draft.type';
import type { SentKudos } from './sent-kudos.type';

/**
 * A Kudos as the server action takes it. A sticker's `id` only tells stickers apart while writing,
 * and its `side` means nothing on a card with one.
 */
export function toSentKudos(draft: KudosDraft): SentKudos {
  return {
    message: draft.message,
    card: {
      templateKey: draft.templateKey,
      textStyle: draft.textStyle,
      stickers: draft.stickers.map(
        ({ id: _id, side: _side, ...sticker }) => sticker,
      ),
    },
  };
}
