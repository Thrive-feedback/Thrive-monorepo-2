import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** The Invitation a route under `/v1/invitations/:invitationId` acts on. */
export const invitationPathParamsSchema = z.strictObject({
  invitationId: z.uuid(),
});
export class InvitationPathParamsDto extends createZodDto(
  invitationPathParamsSchema,
) {}
