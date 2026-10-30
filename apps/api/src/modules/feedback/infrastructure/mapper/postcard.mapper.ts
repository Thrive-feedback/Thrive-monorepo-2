import { Prisma } from '@app/infrastructure/database/generated/client';
import { z } from 'zod';
import {
  POSTCARD_ALIGNS,
  POSTCARD_FONTS,
  POSTCARD_INKS,
  POSTCARD_SIDES,
  POSTCARD_TONES,
  type PostcardSnapshot,
} from '../../domain/value-object/postcard.vo';

/**
 * The stored shape, read back without the value's limits: a card was valid when it was sent, and
 * a limit changed later must not stop its Feedback being read.
 */
const storedPostcardSchema = z.object({
  templateKey: z.string(),
  tone: z.enum(POSTCARD_TONES),
  textStyle: z.object({
    font: z.enum(POSTCARD_FONTS),
    sizeStep: z.number(),
    align: z.enum(POSTCARD_ALIGNS),
    ink: z.enum(POSTCARD_INKS),
  }),
  stickers: z.array(
    z.object({
      stickerKey: z.string(),
      side: z.enum(POSTCARD_SIDES),
      x: z.number(),
      y: z.number(),
      scale: z.number(),
      rotation: z.number(),
    }),
  ),
  stampKey: z.string().nullable(),
});

/** Prisma tells a stored `null` from an absent one, so a card that is not there is `DbNull`. */
export function toPostcardRecord(postcard: PostcardSnapshot | null) {
  return postcard ?? Prisma.DbNull;
}

export function toPostcardSnapshot(stored: unknown): PostcardSnapshot | null {
  return stored === null ? null : storedPostcardSchema.parse(stored);
}
