import { z } from 'zod';
import { MAX_KUDOS_LENGTH } from '@/lib/feedback/kudos-item.type';
import { isWithinMessageLength } from '@/lib/feedback/message-length.util';
import type { KudosCardLook } from './sent-kudos.type';

/** Every value the contract accepts; `satisfies` fails the build if a list drifts from it. */
const FONTS = [
  'modern',
  'classic',
  'signature',
] as const satisfies readonly KudosCardLook['textStyle']['font'][];

const ALIGNS = [
  'left',
  'center',
  'right',
] as const satisfies readonly KudosCardLook['textStyle']['align'][];

const INKS = [
  'ink',
  'navy',
  'forest',
  'plum',
  'brick',
  'paper',
] as const satisfies readonly KudosCardLook['textStyle']['ink'][];

/**
 * The shape the API's own schema accepts, so the browser is never the first to check it. The
 * ranges of a sticker and the template's key are the API's to hold.
 */
export const SentKudosInput = z.object({
  message: z
    .string()
    .trim()
    .min(1)
    .refine((message) => isWithinMessageLength(message, MAX_KUDOS_LENGTH)),
  card: z.strictObject({
    templateKey: z.string().min(1),
    textStyle: z.strictObject({
      font: z.enum(FONTS),
      sizeStep: z.number(),
      align: z.enum(ALIGNS),
      ink: z.enum(INKS),
    }),
    stickers: z.array(
      z.strictObject({
        stickerKey: z.string().min(1),
        x: z.number(),
        y: z.number(),
        scale: z.number(),
        rotation: z.number(),
      }),
    ),
  }),
});
