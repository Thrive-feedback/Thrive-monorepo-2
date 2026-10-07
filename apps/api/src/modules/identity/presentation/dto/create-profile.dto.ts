import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Only the shape is checked here. Trimming, the length limits and "not blank" belong to
 * the Profile, which answers them with their own error codes.
 */
export const createProfileRequestSchema = z.strictObject({
  /** Up to 100 characters once surrounding and repeated spaces are removed. */
  fullName: z.string(),
  /** What other Members call this person. Up to 50 characters, not unique. */
  displayName: z.string(),
});
export class CreateProfileRequestDto extends createZodDto(
  createProfileRequestSchema,
) {}

export const createProfileResponseSchema = z.object({
  id: z.uuid(),
});
export class CreateProfileResponseDto extends createZodDto(
  createProfileResponseSchema,
) {}
