import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MEMBER_ROLES } from '../../domain/value-object/member-role.vo';
import { pageQueryShape, pageResultShape } from './page.dto';

export const listMyMembershipsQuerySchema = z.strictObject(pageQueryShape);
export class ListMyMembershipsQueryDto extends createZodDto(
  listMyMembershipsQuerySchema,
) {}

const membershipSchema = z.object({
  workspace: z.object({ id: z.uuid(), name: z.string() }),
  role: z.enum(MEMBER_ROLES),
});

export const listMyMembershipsResponseSchema = z.object({
  /** Oldest first. Empty while the caller belongs to no Workspace. */
  items: z.array(membershipSchema),
  ...pageResultShape,
});
export class ListMyMembershipsResponseDto extends createZodDto(
  listMyMembershipsResponseSchema,
) {}
