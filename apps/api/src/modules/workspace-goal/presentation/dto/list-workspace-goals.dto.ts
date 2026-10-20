import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { WORKSPACE_GOAL_STATUSES } from '../../domain/value-object/workspace-goal-status.vo';

export const listWorkspaceGoalsQuerySchema = z.strictObject(pageQueryShape);
export class ListWorkspaceGoalsQueryDto extends createZodDto(
  listWorkspaceGoalsQuerySchema,
) {}

const workspaceGoalSchema = z.object({
  id: z.uuid(),
  /** As the Admin wrote it, without the `#`. */
  name: z.string(),
  description: z.string().nullable(),
  /** `HIDDEN` ones are listed to Admins only. */
  status: z.enum(WORKSPACE_GOAL_STATUSES),
});

export const listWorkspaceGoalsResponseSchema = z.object({
  /** Alphabetical, ignoring letter case. */
  items: z.array(workspaceGoalSchema),
  ...pageResultShape,
});
export class ListWorkspaceGoalsResponseDto extends createZodDto(
  listWorkspaceGoalsResponseSchema,
) {}
