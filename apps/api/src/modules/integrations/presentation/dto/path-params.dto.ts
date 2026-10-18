import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** The read of a Workspace's Connections, which names no tool. */
export const workspacePathParamsSchema = z.object({
  workspaceId: z.uuid(),
});
export class WorkspacePathParamsDto extends createZodDto(
  workspacePathParamsSchema,
) {}

/**
 * The same path, plus the chat tool a route acts on. The provider is a plain string here and
 * checked against the tools Thrive connects to in the use case, so an unknown one answers
 * `PROVIDER_NOT_SUPPORTED` rather than reading as a malformed request.
 */
export const integrationPathParamsSchema = z.object({
  workspaceId: z.uuid(),
  provider: z.string().min(1).max(32),
});
export class IntegrationPathParamsDto extends createZodDto(
  integrationPathParamsSchema,
) {}
