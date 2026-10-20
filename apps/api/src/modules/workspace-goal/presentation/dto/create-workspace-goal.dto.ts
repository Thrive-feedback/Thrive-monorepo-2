import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Only the shape is checked here. Trimming, the leading `#`, lengths, spaces and which
 * characters a name may hold belong to the name and the description, each with its own code.
 */
export const createWorkspaceGoalRequestSchema = z.strictObject({
  /**
   * What it is written as after its `#`. At most 30 characters; letters of any script, digits,
   * `-` and `_`, and no spaces. Unique in the Workspace ignoring letter case, hidden ones
   * included.
   */
  name: z.string(),
  /** One sentence saying what it means, up to 200 characters. Blank is no description. */
  description: z.string().optional(),
});
export class CreateWorkspaceGoalRequestDto extends createZodDto(
  createWorkspaceGoalRequestSchema,
) {}

export const createWorkspaceGoalResponseSchema = z.object({
  id: z.uuid(),
});
export class CreateWorkspaceGoalResponseDto extends createZodDto(
  createWorkspaceGoalResponseSchema,
) {}
