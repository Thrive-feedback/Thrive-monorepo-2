import type { PlacedPostcardSticker } from '@/components/organisms/postcard-dialog/postcard-draft.type';
import type {
  KudosTemplateKey,
  KudosTextStyle,
} from './kudos-template.constant';

/**
 * Everything on a Kudos card when Send is pressed. Who it is for is not here: the API reads that
 * from the people the message mentions. A sticker's `side` is only there for `PostcardSticker`: a
 * Kudos card has one side.
 */
export type KudosDraft = {
  readonly message: string;
  readonly templateKey: KudosTemplateKey;
  readonly textStyle: KudosTextStyle;
  /** Up to `MAX_STICKERS`. */
  readonly stickers: readonly PlacedPostcardSticker[];
};
