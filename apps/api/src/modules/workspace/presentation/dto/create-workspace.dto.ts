import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { TEAM_SIZES } from '../../domain/value-object/team-size.vo';

/**
 * Only the shape is checked here. Trimming, the length limit and "not blank" belong to the
 * Workspace name, which answers them with its own error codes.
 */
export const createWorkspaceRequestSchema = z.strictObject({
  /** Up to 100 characters once surrounding and repeated spaces are removed. Not unique. */
  name: z.string(),
  /** How many people the Workspace is for. Optional, and never a limit on Seats. */
  teamSize: z.enum(TEAM_SIZES).nullable().optional(),
});
export class CreateWorkspaceRequestDto extends createZodDto(
  createWorkspaceRequestSchema,
) {}

export const createWorkspaceResponseSchema = z.object({
  id: z.uuid(),
});
export class CreateWorkspaceResponseDto extends createZodDto(
  createWorkspaceResponseSchema,
) {}
