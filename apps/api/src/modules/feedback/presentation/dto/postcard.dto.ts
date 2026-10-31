import { z } from 'zod';
import {
  POSTCARD_ALIGNS,
  POSTCARD_FONTS,
  POSTCARD_INKS,
  POSTCARD_SIDES,
  POSTCARD_TONES,
} from '../../domain/value-object/postcard.vo';

/**
 * How a card looks, on the wire: the same going in and coming out, so a card is read back exactly
 * as it was sent. The closed choices are checked here; the postcard itself holds the rest, each
 * under its one code.
 */
export const postcardSchema = z.strictObject({
  /** A key from the web app's template catalog. */
  templateKey: z.string(),
  tone: z.enum(POSTCARD_TONES),
  textStyle: z.strictObject({
    font: z.enum(POSTCARD_FONTS),
    /** A step along the five message sizes, smallest first: 0 to 4. */
    sizeStep: z.number(),
    align: z.enum(POSTCARD_ALIGNS),
    ink: z.enum(POSTCARD_INKS),
  }),
  /** Up to three, oldest first: a later sticker sits on an earlier one. */
  stickers: z.array(
    z.strictObject({
      /** A key from the web app's sticker catalog. */
      stickerKey: z.string(),
      side: z.enum(POSTCARD_SIDES),
      /** The sticker's centre, as a percentage of that side's width and height. */
      x: z.number(),
      y: z.number(),
      /** Against the sticker's usual size, 0.5 to 2.5. */
      scale: z.number(),
      /** In degrees, -180 to 180. */
      rotation: z.number(),
    }),
  ),
  /**
   * The card's one stamp, a key from the web app's stamp catalog, or `null` for none. It is always
   * upright in the top-right corner of the back.
   */
  stampKey: z.string().nullable(),
});

/**
 * What an answer decides about how it looks, out of the card it is written on: the picture, the
 * paper and the stamp are the Ask's.
 */
export const answerPostcardSchema = postcardSchema.pick({
  textStyle: true,
  stickers: true,
});
