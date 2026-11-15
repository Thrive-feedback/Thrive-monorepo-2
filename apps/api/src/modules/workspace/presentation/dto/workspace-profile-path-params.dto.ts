import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** One Profile, by its slug, opened inside the Workspace a route under `/v1/workspaces/:workspaceId` acts in. */
export const workspaceProfilePathParamsSchema = z.strictObject({
  workspaceId: z.uuid(),
  /** No slug is longer than 64 characters; one that is names nobody, so it is refused unread. */
  slug: z.string().min(1).max(64),
});
export class WorkspaceProfilePathParamsDto extends createZodDto(
  workspaceProfilePathParamsSchema,
) {}
