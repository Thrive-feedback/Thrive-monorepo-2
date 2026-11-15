import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MEMBER_STATUSES } from '../../application/types/membership.types';
import { MEMBER_ROLES } from '../../domain/value-object/member-role.vo';

export const getWorkspaceProfileResponseSchema = z.object({
  accountId: z.uuid(),
  slug: z.string(),
  email: z.string(),
  fullName: z.string(),
  /** The name others see and call them by. */
  displayName: z.string(),
  /** Their photo from Google; `null` when Google has none. */
  photoUrl: z.url().nullable(),
  /** Their Role in this Workspace. */
  role: z.enum(MEMBER_ROLES),
  /** `DEACTIVATED` for someone who was in this Workspace and is no longer. */
  status: z.enum(MEMBER_STATUSES),
  /** When they joined this Workspace. */
  joinedAt: z.iso.datetime({ offset: true }),
});
export class GetWorkspaceProfileResponseDto extends createZodDto(
  getWorkspaceProfileResponseSchema,
) {}
