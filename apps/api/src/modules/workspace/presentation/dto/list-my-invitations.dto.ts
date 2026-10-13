import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const listMyInvitationsQuerySchema = z.strictObject(pageQueryShape);
export class ListMyInvitationsQueryDto extends createZodDto(
  listMyInvitationsQuerySchema,
) {}

const pendingInvitationSchema = z.object({
  invitationId: z.uuid(),
  workspace: z.object({
    id: z.uuid(),
    name: z.string(),
    memberCount: z.number().int(),
  }),
  invitedAt: z.iso.datetime({ offset: true }),
  expiresAt: z.iso.datetime({ offset: true }),
});

export const listMyInvitationsResponseSchema = z.object({
  /** Newest first. Only Pending ones: not accepted, revoked or expired. */
  items: z.array(pendingInvitationSchema),
  ...pageResultShape,
});
export class ListMyInvitationsResponseDto extends createZodDto(
  listMyInvitationsResponseSchema,
) {}
