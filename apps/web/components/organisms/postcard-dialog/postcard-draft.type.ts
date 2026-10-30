import type { SELECTED_PEOPLE } from '@/components/organisms/visibility-picker';
import type { Teammate } from '@/lib/feedback/teammate.type';
import type { PaperTone, PostcardTextStyle } from './postcard-style.constant';

/**
 * Who else can read a postcard; whoever it is for always can. The values are the API's own, so a
 * caller hands them on unchanged. `ONLY_ME` is shown to the Giver as "Only them".
 */
export type PostcardVisibility =
  | 'ONLY_ME'
  | typeof SELECTED_PEOPLE
  | 'EVERYONE';

/** The two sides of a postcard: the picture on the front, the message on the back. */
export type PostcardSide = 'front' | 'back';

/**
 * A sticker stuck on one side of a card. Its centre is held as a share of that side's width and
 * height, so it stays put as the card grows; `scale` is against the sticker's usual size and
 * `rotation` is in degrees.
 */
export type PlacedPostcardSticker = {
  readonly id: string;
  /** Which sticker: a key from `POSTCARD_STICKERS`. */
  readonly stickerKey: string;
  readonly side: PostcardSide;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly rotation: number;
};

/** Who is writing, as the card signs it. */
export type PostcardWriter = {
  readonly name: string;
  readonly photoUrl: string | null;
};

/**
 * Everything on a postcard when Send is pressed. The Feedback itself is who it is for,
 * the message and who else can read it; the picture, the paper and the text's style are how it
 * looks.
 */
export type PostcardDraft = {
  readonly recipientAccountIds: readonly string[];
  readonly message: string;
  readonly visibility: PostcardVisibility;
  /**
   * Who else can read it. As handed to `onSend`, empty unless `visibility` is Selected people,
   * and never a Receiver; while writing, the picker keeps its list so switching back restores it.
   */
  readonly selectedAccountIds: ReadonlySet<string>;
  /** The picture on the front: a key from `POSTCARD_TEMPLATES`. */
  readonly templateKey: string;
  /** Up to `MAX_STICKERS`, on either side. */
  readonly stickers: readonly PlacedPostcardSticker[];
  /** The card's one stamp, a key from `POSTCARD_STAMPS`, always in the top-right of the back. */
  readonly stampKey: string | null;
  readonly tone: PaperTone;
  readonly textStyle: PostcardTextStyle;
};

/** Which card: Feedback given unasked, a Feedback Request, or the answer to one Ask. */
export type PostcardKind = 'give' | 'ask' | 'answer';

/** A sticker the Requester stuck on: where it is and how it looks, and nothing can change it. */
export type PostcardAskSticker = Omit<PlacedPostcardSticker, 'id'>;

/**
 * The Ask being answered, as its Requester wrote it. A request and its answers are one card, so
 * everything on it shows while answering, and none of it can be changed.
 */
export type PostcardAsk = {
  readonly requester: PostcardWriter;
  /** The picture on the front: a key from `POSTCARD_TEMPLATES`. */
  readonly templateKey: string;
  readonly stickers: readonly PostcardAskSticker[];
  /** The card's one stamp, a key from `POSTCARD_STAMPS`, or `null` for none. */
  readonly stampKey: string | null;
  /** The Request message. */
  readonly message: string;
  /** The Requester's paper, which the answer is written on too. */
  readonly tone: PaperTone;
  readonly textStyle: PostcardTextStyle;
};

/**
 * Everything on an answer when Send answer is pressed: the Feedback message and how it looks,
 * stickers included. The front and the stamp are the Requester's, so an answer's stickers are all
 * on the back.
 */
export type PostcardAnswer = {
  readonly message: string;
  readonly stickers: readonly PlacedPostcardSticker[];
  readonly textStyle: PostcardTextStyle;
};

/** Which card is written, with what only that card needs. */
export type PostcardCard =
  | {
      kind: Exclude<PostcardKind, 'answer'>;
      teammates: readonly Teammate[];
      workspaceGoals: readonly string[];
      /** Who it is for as it opens. Read once: the card owns it from then on. */
      defaultRecipientAccountIds: readonly string[];
      onSend: (postcard: PostcardDraft) => Promise<boolean>;
    }
  | {
      kind: 'answer';
      teammates: readonly Teammate[];
      workspaceGoals: readonly string[];
      ask: PostcardAsk;
      onSend: (answer: PostcardAnswer) => Promise<boolean>;
    };
