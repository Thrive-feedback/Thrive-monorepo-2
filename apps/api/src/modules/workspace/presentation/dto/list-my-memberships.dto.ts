import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MEMBER_STATUSES } from '../../application/types/membership.types';
import { MEMBER_ROLES } from '../../domain/value-object/member-role.vo';

export const listMyMembershipsQuerySchema = z.strictObject({
  ...pageQueryShape,
  /** Workspaces the caller can open, or those they were Deactivated in. */
  status: z.enum(MEMBER_STATUSES).default('ACTIVE'),
});
export class ListMyMembershipsQueryDto extends createZodDto(
  listMyMembershipsQuerySchema,
) {}

const membershipSchema = z.object({
  workspace: z.object({ id: z.uuid(), name: z.string() }),
  role: z.enum(MEMBER_ROLES),
});

export const listMyMembershipsResponseSchema = z.object({
  /**
   * The one used last first. Empty while the caller belongs to no Workspace; which one their session
   * is in is `members/mine/current`.
   */
  items: z.array(membershipSchema),
  ...pageResultShape,
});
export class ListMyMembershipsResponseDto extends createZodDto(
  listMyMembershipsResponseSchema,
) {}
