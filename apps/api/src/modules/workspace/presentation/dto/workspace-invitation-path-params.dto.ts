import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** One Invitation of the Workspace a route under `/v1/workspaces/:workspaceId` acts inside. */
export const workspaceInvitationPathParamsSchema = z.strictObject({
  workspaceId: z.uuid(),
  invitationId: z.uuid(),
});
export class WorkspaceInvitationPathParamsDto extends createZodDto(
  workspaceInvitationPathParamsSchema,
) {}
