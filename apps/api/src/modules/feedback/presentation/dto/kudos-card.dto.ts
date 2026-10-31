import { z } from 'zod';
import { KUDOS_INKS } from '../../domain/value-object/kudos-card.vo';
import {
  POSTCARD_ALIGNS,
  POSTCARD_FONTS,
} from '../../domain/value-object/postcard.vo';

/**
 * How a Kudos card looks, on the wire: the same going in and coming out, so a card is read back
 * exactly as it was sent. The closed choices are checked here; the card itself holds the rest,
 * under its one code.
 */
export const kudosCardSchema = z.strictObject({
  /** A key from the web app's Kudos templates. */
  templateKey: z.string(),
  textStyle: z.strictObject({
    font: z.enum(POSTCARD_FONTS),
    /** The largest of the five sizes it may be set in, smallest first: 0 to 4. */
    sizeStep: z.number(),
    align: z.enum(POSTCARD_ALIGNS),
    ink: z.enum(KUDOS_INKS),
  }),
  /** Up to three, oldest first: a later sticker sits on an earlier one. */
  stickers: z.array(
    z.strictObject({
      /** A key from the web app's sticker catalog. */
      stickerKey: z.string(),
      /** The sticker's centre, as a percentage of the card's width and height. */
      x: z.number(),
      y: z.number(),
      /** Against the sticker's usual size, 0.5 to 2.5. */
      scale: z.number(),
      /** In degrees, -180 to 180. */
      rotation: z.number(),
    }),
  ),
});
