import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { MEMBER_ROLES } from '../../domain/value-object/member-role.vo';

export const changeMemberRoleRequestSchema = z.strictObject({
  role: z.enum(MEMBER_ROLES),
});
export class ChangeMemberRoleRequestDto extends createZodDto(
  changeMemberRoleRequestSchema,
) {}
