import type {
  PostcardAnswer,
  PostcardDraft,
} from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type { SentAnswer, SentPostcard } from './sent-postcard.type';

/** A card as the server action takes it. Each sticker's `id` only tells stickers apart while writing. */
export function toSentPostcard(draft: PostcardDraft): SentPostcard {
  return {
    recipientAccountIds: draft.recipientAccountIds,
    message: draft.message,
    visibility: draft.visibility,
    selectedAccountIds: [...draft.selectedAccountIds],
    look: {
      templateKey: draft.templateKey,
      tone: draft.tone,
      textStyle: draft.textStyle,
      stickers: draft.stickers.map(({ id: _id, ...sticker }) => sticker),
      stampKey: draft.stampKey,
    },
  };
}

/** An answer as the server action takes it, on the same terms as `toSentPostcard`. */
export function toSentAnswer(answer: PostcardAnswer): SentAnswer {
  return {
    message: answer.message,
    look: {
      textStyle: answer.textStyle,
      stickers: answer.stickers.map(({ id: _id, ...sticker }) => sticker),
    },
  };
}
