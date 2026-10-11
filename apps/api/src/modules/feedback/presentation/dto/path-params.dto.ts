import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Shared by the routes under `/v1/workspaces/:workspaceId` that name no further resource. */
export const workspacePathParamsSchema = z.object({
  workspaceId: z.uuid(),
});
export class WorkspacePathParamsDto extends createZodDto(
  workspacePathParamsSchema,
) {}

/** The same path, plus the one Feedback Request a route acts on. */
export const feedbackRequestPathParamsSchema = z.object({
  workspaceId: z.uuid(),
  requestId: z.uuid(),
});
export class FeedbackRequestPathParamsDto extends createZodDto(
  feedbackRequestPathParamsSchema,
) {}
