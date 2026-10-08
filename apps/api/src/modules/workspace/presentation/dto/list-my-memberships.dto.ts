import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MEMBER_ROLES } from '../../domain/value-object/member-role.vo';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export const listMyMembershipsQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});
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
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export class ListMyMembershipsResponseDto extends createZodDto(
  listMyMembershipsResponseSchema,
) {}
