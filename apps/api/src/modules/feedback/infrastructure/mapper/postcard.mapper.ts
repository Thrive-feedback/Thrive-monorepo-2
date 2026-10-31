import { Prisma } from '@app/infrastructure/database/generated/client';
import { z } from 'zod';
import type { FeedbackOrigin } from '../../domain/entity/feedback.entity';
import {
  type AnswerPostcardSnapshot,
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

const storedAnswerPostcardSchema = storedPostcardSchema.pick({
  textStyle: true,
  stickers: true,
});

/** Prisma tells a stored `null` from an absent one, so a card that is not there is `DbNull`. */
export function toPostcardRecord(
  postcard: PostcardSnapshot | AnswerPostcardSnapshot | null,
) {
  return postcard ?? Prisma.DbNull;
}

export function toPostcardSnapshot(stored: unknown): PostcardSnapshot | null {
  return stored === null ? null : storedPostcardSchema.parse(stored);
}

/**
 * The card a piece of Feedback is, from `feedback.postcard`, which holds two shapes told apart by
 * `origin` (ADR 0072). Reach for this, not `toPostcardSnapshot`, on that column: an answer is only
 * part of a card, so it has none here, and is read with its request.
 */
export function toFeedbackPostcardSnapshot(
  origin: FeedbackOrigin,
  stored: unknown,
): PostcardSnapshot | null {
  return origin === 'OFFERED' ? toPostcardSnapshot(stored) : null;
}

/** What an answer stored about how it looks. The rest of its card is on the request it answers. */
export function toAnswerPostcardSnapshot(
  stored: unknown,
): AnswerPostcardSnapshot | null {
  return stored === null ? null : storedAnswerPostcardSchema.parse(stored);
}
