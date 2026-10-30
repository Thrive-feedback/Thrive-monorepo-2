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
export type PostcardStampSnapshot = {
  /** A key from the web app's stamp catalog. */
  readonly stampKey: string;
  readonly side: (typeof POSTCARD_SIDES)[number];
  /** The stamp's centre, as a percentage of that side's width and height. */
  readonly x: number;
  readonly y: number;
  /** Against the stamp's usual size. */
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
  /** Oldest first, which is also the order they stack in: a later stamp sits on an earlier one. */
  readonly stamps: readonly PostcardStampSnapshot[];
};

const MAX_STAMPS = 3;
const MAX_SIZE_STEP = 4;
const MIN_STAMP_SCALE = 0.5;
const MAX_STAMP_SCALE = 2.5;
const MAX_STAMP_ROTATION = 180;

/** `system/` and a file's name without its extension. Bounded so a key cannot carry a payload. */
const PICTURE_KEY = /^system\/[a-z0-9_-]{1,100}$/;

function isWithin(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

function isValidStamp(stamp: PostcardStampSnapshot) {
  return (
    PICTURE_KEY.test(stamp.stampKey) &&
    isWithin(stamp.x, 0, 100) &&
    isWithin(stamp.y, 0, 100) &&
    isWithin(stamp.scale, MIN_STAMP_SCALE, MAX_STAMP_SCALE) &&
    isWithin(stamp.rotation, -MAX_STAMP_ROTATION, MAX_STAMP_ROTATION)
  );
}

/**
 * How a Feedback message or a Request message looks: the picture on its front, its paper, how its
 * words are set and the stamps stuck on it. Everyone who reads the words reads the card, so it
 * holds nothing they could not (ADR 0067).
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
      details.stamps.length <= MAX_STAMPS &&
      details.stamps.every(isValidStamp);
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
