import { PostcardInvalidError } from '../feedback-request.errors';

export const POSTCARD_TONES = ['cream', 'sage', 'blush'] as const;
export const POSTCARD_FONTS = ['modern', 'classic', 'signature'] as const;
export const POSTCARD_ALIGNS = ['left', 'center', 'right'] as const;
export const POSTCARD_INKS = [
  'ink',
  'navy',
  'forest',
  'plum',
  'brick',
] as const;
export const POSTCARD_SIDES = ['front', 'back'] as const;

/**
 * Aliases rather than interfaces, unlike the snapshots around them: Prisma's JSON input takes an
 * object with an index signature, which a type alias satisfies and an interface does not.
 */
export type PostcardStickerSnapshot = {
  /** A key from the web app's sticker catalog. */
  readonly stickerKey: string;
  readonly side: (typeof POSTCARD_SIDES)[number];
  /** The sticker's centre, as a percentage of that side's width and height. */
  readonly x: number;
  readonly y: number;
  /** Against the sticker's usual size. */
  readonly scale: number;
  /** In degrees. */
  readonly rotation: number;
};

export type PostcardSnapshot = {
  /** A key from the web app's template catalog. */
  readonly templateKey: string;
  readonly tone: (typeof POSTCARD_TONES)[number];
  readonly textStyle: {
    readonly font: (typeof POSTCARD_FONTS)[number];
    /** A step along the web app's five message sizes, smallest first. */
    readonly sizeStep: number;
    readonly align: (typeof POSTCARD_ALIGNS)[number];
    readonly ink: (typeof POSTCARD_INKS)[number];
  };
  /** Oldest first, which is also the order they stack in: a later one sits on an earlier one. */
  readonly stickers: readonly PostcardStickerSnapshot[];
  /**
   * The card's one stamp, a key from the web app's stamp catalog, or `null` for none. Only which
   * stamp is stored: it is always upright in the top-right corner of the back.
   */
  readonly stampKey: string | null;
};

const MAX_STICKERS = 3;
const MAX_SIZE_STEP = 4;
const MIN_STICKER_SCALE = 0.5;
const MAX_STICKER_SCALE = 2.5;
const MAX_ROTATION = 180;

/** `system/` and a file's name without its extension. Bounded so a key cannot carry a payload. */
const PICTURE_KEY = /^system\/[a-z0-9_-]{1,100}$/;

function isWithin(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

function isValidSticker(sticker: PostcardStickerSnapshot) {
  return (
    PICTURE_KEY.test(sticker.stickerKey) &&
    isWithin(sticker.x, 0, 100) &&
    isWithin(sticker.y, 0, 100) &&
    isWithin(sticker.scale, MIN_STICKER_SCALE, MAX_STICKER_SCALE) &&
    isWithin(sticker.rotation, -MAX_ROTATION, MAX_ROTATION)
  );
}

/**
 * How a Feedback message or a Request message looks: the picture on its front, its paper, how its
 * words are set, the stickers on it and its stamp. Everyone who reads the words reads the card, so
 * it holds nothing they could not (ADRs 0067, 0068).
 *
 * The catalogs of pictures belong to the web app, and a retired picture stays valid on the cards
 * that used it, so a key is checked for its shape and never against a list.
 */
export class Postcard {
  private constructor(private readonly value: PostcardSnapshot) {}

  static of(details: PostcardSnapshot): Postcard {
    const isValid =
      PICTURE_KEY.test(details.templateKey) &&
      Number.isInteger(details.textStyle.sizeStep) &&
      isWithin(details.textStyle.sizeStep, 0, MAX_SIZE_STEP) &&
      details.stickers.length <= MAX_STICKERS &&
      details.stickers.every(isValidSticker) &&
      (details.stampKey === null || PICTURE_KEY.test(details.stampKey));
    if (!isValid) {
      throw new PostcardInvalidError();
    }
    return new Postcard(details);
  }

  /**
   * Rebuilds a stored card without checking it: it was valid when it was sent, and refusing it
   * under later rules would stop its Feedback being read.
   */
  static restore(snapshot: PostcardSnapshot): Postcard {
    return new Postcard(snapshot);
  }

  snapshot(): PostcardSnapshot {
    return this.value;
  }
}
