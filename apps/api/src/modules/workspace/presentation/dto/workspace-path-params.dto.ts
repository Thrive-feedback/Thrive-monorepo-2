import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** The Workspace a route under `/v1/workspaces/:workspaceId` acts inside. */
export const workspacePathParamsSchema = z.strictObject({
  workspaceId: z.uuid(),
});
export class WorkspacePathParamsDto extends createZodDto(
  workspacePathParamsSchema,
) {}
