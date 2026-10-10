import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { INVITATION_STATUSES } from '../../domain/value-object/invitation-status.vo';

export const getInvitationResponseSchema = z.object({
  workspaceName: z.string(),
  /** Left out while the inviter has not introduced themselves. */
  inviterName: z.string().optional(),
  /** The invited address with most of its name hidden, such as `s•••@acme.com`. */
  invitedEmailMasked: z.string(),
  /** Only a `PENDING` Invitation can be accepted. */
  status: z.enum(INVITATION_STATUSES),
});
export class GetInvitationResponseDto extends createZodDto(
  getInvitationResponseSchema,
) {}
