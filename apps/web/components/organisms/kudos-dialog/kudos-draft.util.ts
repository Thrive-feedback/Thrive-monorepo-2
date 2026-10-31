import {
  withStickerAdded,
  withStickerChanged,
} from '@/components/organisms/postcard-dialog/postcard-draft.util';
import type { PostcardStickerChange } from '@/components/organisms/postcard-dialog/postcard-sticker';
import { MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';
import { cutToMessageLength } from '@/lib/feedback/message-length.util';
import type { KudosDraft } from './kudos-draft.type';
import {
  KUDOS_TEMPLATES,
  type KudosTemplateKey,
  type KudosTextStyle,
  randomKudosTemplateKey,
} from './kudos-template.constant';

/** The side every sticker is on, since `PostcardSticker` asks and a Kudos card has one. */
const THE_ONE_SIDE = 'back';

/** The largest size: a short Kudos reads large, and a long one is stepped down from here. */
const LARGEST_SIZE_STEP = 4;

export type KudosDraftChange =
  | { kind: 'message'; message: string }
  | { kind: 'template'; templateKey: KudosTemplateKey }
  | { kind: 'style'; fields: Partial<KudosTextStyle> }
  | { kind: 'addSticker'; id: string; stickerKey: string }
  | { kind: 'changeSticker'; id: string; fields: PostcardStickerChange }
  | { kind: 'removeSticker'; id: string };

/**
 * A new card opens on any template, its words centred and as large as they go, holding what was
 * typed before it opened, as much of it as a Kudos can.
 */
export function blankKudosDraft(defaultMessage: string): KudosDraft {
  const templateKey = randomKudosTemplateKey();
  const { font, ink } = KUDOS_TEMPLATES[templateKey];
  return {
    message: cutToMessageLength(
      defaultMessage,
      defaultMessage.length,
      MAX_KUDOS_LENGTH,
    ),
    templateKey,
    textStyle: { font, ink, sizeStep: LARGEST_SIZE_STEP, align: 'center' },
    stickers: [],
  };
}

export function applyKudosChange(
  draft: KudosDraft,
  change: KudosDraftChange,
): KudosDraft {
  switch (change.kind) {
    case 'message':
      return { ...draft, message: change.message };
    case 'template': {
      // The template's font and ink come with it, so the words can always be read on it; how large
      // they are and where they sit are the Giver's own and stay.
      const { font, ink } = KUDOS_TEMPLATES[change.templateKey];
      return {
        ...draft,
        templateKey: change.templateKey,
        textStyle: { ...draft.textStyle, font, ink },
      };
    }
    case 'style':
      return { ...draft, textStyle: { ...draft.textStyle, ...change.fields } };
    case 'addSticker':
      return {
        ...draft,
        stickers: withStickerAdded(draft.stickers, {
          id: change.id,
          stickerKey: change.stickerKey,
          side: THE_ONE_SIDE,
        }),
      };
    case 'changeSticker':
      return {
        ...draft,
        stickers: withStickerChanged(draft.stickers, change.id, change.fields),
      };
    case 'removeSticker':
      return {
        ...draft,
        stickers: draft.stickers.filter((sticker) => sticker.id !== change.id),
      };
  }
}
