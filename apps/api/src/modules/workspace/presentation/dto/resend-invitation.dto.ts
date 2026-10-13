import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const resendInvitationResponseSchema = z.object({
  /** The Invitation now Pending: the same one, or a new one when it had expired. */
  invitationId: z.uuid(),
  expiresAt: z.iso.datetime({ offset: true }),
});
export class ResendInvitationResponseDto extends createZodDto(
  resendInvitationResponseSchema,
) {}
