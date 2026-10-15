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

/** The same path, plus the one piece of Feedback a route acts on. */
export const feedbackPathParamsSchema = z.object({
  workspaceId: z.uuid(),
  feedbackId: z.uuid(),
});
export class FeedbackPathParamsDto extends createZodDto(
  feedbackPathParamsSchema,
) {}

/** The same path, plus the one Ask a route acts on. */
export const feedbackAskPathParamsSchema = z.object({
  workspaceId: z.uuid(),
  askId: z.uuid(),
});
export class FeedbackAskPathParamsDto extends createZodDto(
  feedbackAskPathParamsSchema,
) {}
