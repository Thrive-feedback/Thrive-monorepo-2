import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MEMBER_ROLES } from '../../domain/value-object/member-role.vo';
import { pageQueryShape, pageResultShape } from './page.dto';

export const listWorkspaceMembersQuerySchema = z.strictObject(pageQueryShape);
export class ListWorkspaceMembersQueryDto extends createZodDto(
  listWorkspaceMembersQuerySchema,
) {}

const workspaceMemberSchema = z.object({
  accountId: z.uuid(),
  email: z.string(),
  /** `null` while the Member has not introduced themselves. */
  fullName: z.string().nullable(),
  role: z.enum(MEMBER_ROLES),
});

export const listWorkspaceMembersResponseSchema = z.object({
  /** Oldest first, so the Owner who founded the Workspace comes first. */
  items: z.array(workspaceMemberSchema),
  ...pageResultShape,
});
export class ListWorkspaceMembersResponseDto extends createZodDto(
  listWorkspaceMembersResponseSchema,
) {}
