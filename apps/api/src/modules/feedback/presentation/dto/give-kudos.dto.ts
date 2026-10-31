import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { kudosCardSchema } from './kudos-card.dto';

/**
 * Only the shape is checked here. Trimming, the length limit and "not blank" belong to the Kudos
 * message, and who it is for is read out of its @mentions by the Kudos — each with its own code.
 */
export const giveKudosRequestSchema = z.strictObject({
  /** What the Giver wrote, up to 280 characters once trimmed, @mentioning who it is for, if anyone. */
  message: z.string(),
  /** How it looks; left out when it was not written on a card. */
  card: kudosCardSchema.optional(),
});
export class GiveKudosRequestDto extends createZodDto(giveKudosRequestSchema) {}

export const giveKudosResponseSchema = z.object({
  id: z.uuid(),
});
export class GiveKudosResponseDto extends createZodDto(
  giveKudosResponseSchema,
) {}
