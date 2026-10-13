import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OPEN_INVITATION_STATUSES } from '../../domain/value-object/invitation-status.vo';
import { MEMBER_ROLES } from '../../domain/value-object/member-role.vo';

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
  /** When it was first sent. Resending moves `expiresAt`, never this. */
  invitedAt: z.iso.datetime({ offset: true }),
  expiresAt: z.iso.datetime({ offset: true }),
  invitedBy: z.object({
    email: z.string(),
    /** `null` while they have not introduced themselves. */
    displayName: z.string().nullable(),
  }),
});

export const listWorkspaceInvitationsResponseSchema = z.object({
  /** Newest first. */
  items: z.array(invitationSchema),
  ...pageResultShape,
});
export class ListWorkspaceInvitationsResponseDto extends createZodDto(
  listWorkspaceInvitationsResponseSchema,
) {}
