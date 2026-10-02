import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const currentAccountSchema = z.object({
  email: z.email(),
  name: z.string(),
});

export const getCurrentSessionResponseSchema = z.object({
  /** `null` when the caller is signed out, or their session is forged or expired. */
  account: currentAccountSchema.nullable(),
});
export class GetCurrentSessionResponseDto extends createZodDto(
  getCurrentSessionResponseSchema,
) {}
