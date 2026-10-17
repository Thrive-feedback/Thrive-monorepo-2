import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** One Member of the Workspace a route under `/v1/workspaces/:workspaceId` acts inside. */
export const workspaceMemberPathParamsSchema = z.strictObject({
  workspaceId: z.uuid(),
  accountId: z.uuid(),
});
export class WorkspaceMemberPathParamsDto extends createZodDto(
  workspaceMemberPathParamsSchema,
) {}
