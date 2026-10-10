import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OPEN_INVITATION_STATUSES } from '../../domain/value-object/invitation-status.vo';
import { MEMBER_ROLES } from '../../domain/value-object/member-role.vo';
import { pageQueryShape, pageResultShape } from './page.dto';

export const listWorkspaceInvitationsQuerySchema =
  z.strictObject(pageQueryShape);
export class ListWorkspaceInvitationsQueryDto extends createZodDto(
  listWorkspaceInvitationsQuerySchema,
) {}

const invitationSchema = z.object({
  invitationId: z.uuid(),
  email: z.string(),
  /** The Role the invited person will join with. */
  role: z.enum(MEMBER_ROLES),
  /** `PENDING` until its 7 days pass, then `EXPIRED`. Accepted and revoked ones are not listed. */
  status: z.enum(OPEN_INVITATION_STATUSES),
  expiresAt: z.iso.datetime({ offset: true }),
});

export const listWorkspaceInvitationsResponseSchema = z.object({
  /** Newest first. */
  items: z.array(invitationSchema),
  ...pageResultShape,
});
export class ListWorkspaceInvitationsResponseDto extends createZodDto(
  listWorkspaceInvitationsResponseSchema,
) {}
