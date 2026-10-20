import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MEMBER_STATUSES } from '../../application/types/membership.types';
import { MEMBER_ROLES } from '../../domain/value-object/member-role.vo';

export const listWorkspaceMembersQuerySchema = z.strictObject({
  ...pageQueryShape,
  /** Active Members, who can open the Workspace, or those Deactivated there. */
  status: z.enum(MEMBER_STATUSES).default('ACTIVE'),
});
export class ListWorkspaceMembersQueryDto extends createZodDto(
  listWorkspaceMembersQuerySchema,
) {}

const workspaceMemberSchema = z.object({
  accountId: z.uuid(),
  email: z.string(),
  /** `null` while the Member has not introduced themselves. */
  fullName: z.string().nullable(),
  /** The name others see and call them by; `null` while they have not introduced themselves. */
  displayName: z.string().nullable(),
  /** The slug others mention them by; `null` while they have not introduced themselves. */
  slug: z.string().nullable(),
  /** Their photo from Google; `null` when Google has none. */
  photoUrl: z.url().nullable(),
  role: z.enum(MEMBER_ROLES),
});

export const listWorkspaceMembersResponseSchema = z.object({
  /** Oldest first, so among active Members the Admin who founded the Workspace comes first. */
  items: z.array(workspaceMemberSchema),
  ...pageResultShape,
});
export class ListWorkspaceMembersResponseDto extends createZodDto(
  listWorkspaceMembersResponseSchema,
) {}
