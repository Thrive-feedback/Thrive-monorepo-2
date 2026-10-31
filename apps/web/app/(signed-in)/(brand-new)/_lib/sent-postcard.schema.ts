import { z } from 'zod';
import { isWithinMessageLength } from '@/lib/feedback/message-length.util';
import type { PostcardLook, SentPostcard } from './sent-postcard.type';

/** Every value the contract accepts; `satisfies` fails the build if a list drifts from it. */
const VISIBILITIES = [
  'ONLY_ME',
  'SELECTED_PEOPLE',
  'EVERYONE',
] as const satisfies readonly SentPostcard['visibility'][];

const TONES = [
  'cream',
  'sage',
  'blush',
] as const satisfies readonly PostcardLook['tone'][];

const FONTS = [
  'modern',
  'classic',
  'signature',
] as const satisfies readonly PostcardLook['textStyle']['font'][];

const ALIGNS = [
  'left',
  'center',
  'right',
] as const satisfies readonly PostcardLook['textStyle']['align'][];

const INKS = [
  'ink',
  'navy',
  'forest',
  'plum',
  'brick',
] as const satisfies readonly PostcardLook['textStyle']['ink'][];

const SIDES = [
  'front',
  'back',
] as const satisfies readonly PostcardLook['stickers'][number]['side'][];

const TextStyle = z.strictObject({
  font: z.enum(FONTS),
  sizeStep: z.number(),
  align: z.enum(ALIGNS),
  ink: z.enum(INKS),
});

const Stickers = z.array(
  z.strictObject({
    stickerKey: z.string().min(1),
    side: z.enum(SIDES),
    x: z.number(),
    y: z.number(),
    scale: z.number(),
    rotation: z.number(),
  }),
);

/**
 * The shape the API's own schema accepts, so the browser is never the first to check it. The
 * ranges of a sticker and the keys of the pictures are the API's to hold.
 */
export const SentPostcardInput = z
  .object({
    recipientAccountIds: z.array(z.uuid()).min(1),
    message: z.string().trim().min(1).refine(isWithinMessageLength),
    visibility: z.enum(VISIBILITIES),
    selectedAccountIds: z.array(z.uuid()),
    look: z.strictObject({
      templateKey: z.string().min(1),
      tone: z.enum(TONES),
      textStyle: TextStyle,
      stickers: Stickers,
      stampKey: z.string().min(1).nullable(),
    }),
  })
  .refine(
    (input) =>
      input.visibility !== 'SELECTED_PEOPLE' ||
      input.selectedAccountIds.length > 0,
  );

/** An answer, on the same terms: only the API knows a sticker must stay on the back. */
export const SentAnswerInput = z.object({
  askId: z.uuid(),
  message: z.string().trim().min(1).refine(isWithinMessageLength),
  look: z.strictObject({ textStyle: TextStyle, stickers: Stickers }),
});
