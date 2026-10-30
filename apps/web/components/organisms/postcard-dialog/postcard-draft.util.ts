import { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import type {
  PlacedPostcardSticker,
  PostcardCard,
  PostcardDraft,
  PostcardKind,
  PostcardSide,
  PostcardVisibility,
} from './postcard-draft.type';
import type { PostcardStickerChange } from './postcard-sticker';
import { MAX_STICKERS } from './postcard-sticker.constant';
import {
  DEFAULT_TEXT_STYLE,
  type PostcardTextStyle,
} from './postcard-style.constant';
import { randomTemplateKey } from './postcard-template.constant';

/**
 * What the card itself holds. Who else reads it follows what the message mentions, so that is
 * worked out beside it and joins it when the card is handed over.
 */
export type CardState = Omit<
  PostcardDraft,
  'visibility' | 'selectedAccountIds'
>;

/** One change to the card: some of its fields, a part of the text's style, or one sticker. */
export type DraftChange =
  | {
      kind: 'card';
      fields: Partial<Omit<CardState, 'textStyle' | 'stickers'>>;
    }
  | { kind: 'style'; fields: Partial<PostcardTextStyle> }
  | { kind: 'addSticker'; id: string; stickerKey: string; side: PostcardSide }
  | { kind: 'changeSticker'; id: string; fields: PostcardStickerChange }
  | { kind: 'removeSticker'; id: string };

/** How far each sticker already on a side moves a new one off the centre, in % of the side. */
const STICKER_OFFSET = 6;

const NO_STICKERS: readonly PlacedPostcardSticker[] = [];

/** Nobody: no recipients, the same empty list every render. */
export const NOBODY: readonly string[] = [];

/** A turn in degrees, as the same turn between -180 (left out) and 180. */
function normalTurn(degrees: number) {
  const turned = ((degrees % 360) + 360) % 360;
  return turned > 180 ? turned - 360 : turned;
}

export function applyChange(draft: CardState, change: DraftChange): CardState {
  switch (change.kind) {
    case 'style':
      return { ...draft, textStyle: { ...draft.textStyle, ...change.fields } };
    case 'card':
      return { ...draft, ...change.fields };
    case 'addSticker': {
      if (draft.stickers.length >= MAX_STICKERS) {
        return draft;
      }
      // Centred, so it can be moved straight away; each one already there pushes the next down
      // and right, and a step another sticker still sits on is passed over, so none lands hidden
      // under another, even after one has come off.
      const onSide = draft.stickers.filter(
        (sticker) => sticker.side === change.side,
      );
      let offset = onSide.length * STICKER_OFFSET;
      while (
        onSide.some(
          (sticker) => sticker.x === 50 + offset && sticker.y === 50 + offset,
        )
      ) {
        offset += STICKER_OFFSET;
      }
      const sticker: PlacedPostcardSticker = {
        id: change.id,
        stickerKey: change.stickerKey,
        side: change.side,
        x: 50 + offset,
        y: 50 + offset,
        scale: 1,
        rotation: 0,
      };
      return { ...draft, stickers: [...draft.stickers, sticker] };
    }
    case 'changeSticker': {
      // However many times it is turned, the turn handed on is the one it shows.
      const fields =
        change.fields.rotation === undefined
          ? change.fields
          : { ...change.fields, rotation: normalTurn(change.fields.rotation) };
      return {
        ...draft,
        stickers: draft.stickers.map((sticker) =>
          sticker.id === change.id ? { ...sticker, ...fields } : sticker,
        ),
      };
    }
    case 'removeSticker':
      return {
        ...draft,
        stickers: draft.stickers.filter((sticker) => sticker.id !== change.id),
      };
  }
}

export function blankDraft(card: PostcardCard): CardState {
  return {
    recipientAccountIds:
      card.kind === 'answer' ? NOBODY : card.defaultRecipientAccountIds,
    message: '',
    // A new card opens on any picture; an answer is written on the Requester's card.
    templateKey:
      card.kind === 'answer' ? card.ask.templateKey : randomTemplateKey(),
    stickers: NO_STICKERS,
    stampKey: null,
    tone: card.kind === 'answer' ? card.ask.tone : 'cream',
    textStyle: DEFAULT_TEXT_STYLE,
  };
}

export function isReady(
  kind: PostcardKind,
  draft: CardState,
  visibility: PostcardVisibility,
  selectedReaders: ReadonlySet<string>,
) {
  if (kind === 'answer') {
    return draft.message.trim() !== '';
  }
  return (
    draft.recipientAccountIds.length > 0 &&
    draft.message.trim() !== '' &&
    (visibility !== SELECTED_PEOPLE || selectedReaders.size > 0)
  );
}
