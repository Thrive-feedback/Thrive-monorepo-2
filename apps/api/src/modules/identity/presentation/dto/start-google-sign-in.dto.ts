import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const startGoogleSignInRequestSchema = z.strictObject({
  /** The Invitation being accepted, if any. Google then sends the person back to it. */
  invitationId: z.uuid().optional(),
});
export class StartGoogleSignInRequestDto extends createZodDto(
  startGoogleSignInRequestSchema,
) {}

export const startGoogleSignInResponseSchema = z.object({
  /** Google's sign-in page for this attempt. The caller sends the browser there. */
  url: z.url(),
});
export class StartGoogleSignInResponseDto extends createZodDto(
  startGoogleSignInResponseSchema,
) {}
