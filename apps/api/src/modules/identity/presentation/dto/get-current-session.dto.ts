import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const profileSchema = z.object({
  fullName: z.string(),
  displayName: z.string(),
  slug: z.string(),
});

const currentAccountSchema = z.object({
  email: z.email(),
  /** The name the sign-in provider gave, which pre-fills "Introduce yourself". */
  name: z.string(),
  /** `null` until the person has introduced themselves. */
  profile: profileSchema.nullable(),
});

export const getCurrentSessionResponseSchema = z.object({
  /** `null` when the caller is signed out, or their session is forged or expired. */
  account: currentAccountSchema.nullable(),
  /** The session is due to be pushed forward with `POST /v1/sessions/current/refresh`. */
  needsRefresh: z.boolean(),
});
export class GetCurrentSessionResponseDto extends createZodDto(
  getCurrentSessionResponseSchema,
) {}
