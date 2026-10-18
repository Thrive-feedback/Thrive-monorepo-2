import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MEMBER_ROLES } from '../../domain/value-object/member-role.vo';

export const getCurrentMembershipResponseSchema = z.object({
  /**
   * The Workspace the caller's session is in, and their Role there; `null` while the session is
   * in none, so the caller is to choose one, or join or create one if they have none.
   */
  membership: z
    .object({
      workspace: z.object({ id: z.uuid(), name: z.string() }),
      role: z.enum(MEMBER_ROLES),
    })
    .nullable(),
});
export class GetCurrentMembershipResponseDto extends createZodDto(
  getCurrentMembershipResponseSchema,
) {}
