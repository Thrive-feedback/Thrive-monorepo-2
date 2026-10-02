import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const startGoogleSignInResponseSchema = z.object({
  /** Google's sign-in page for this attempt. The caller sends the browser there. */
  url: z.url(),
});
export class StartGoogleSignInResponseDto extends createZodDto(
  startGoogleSignInResponseSchema,
) {}
