import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * The chat tool a route acts on. The provider is a plain string here and checked against the
 * tools Thrive links in the use case, so an unknown one answers `PROVIDER_NOT_SUPPORTED` rather
 * than reading as a malformed request — "Thrive does not do that tool" and "that address is
 * wrong" are different answers.
 *
 * There is no `workspaceId`: a Linked Account belongs to an Account, as `/v1/members/mine` and
 * `/v1/invitations/mine` are the caller's own.
 */
export const linkedAccountPathParamsSchema = z.object({
  provider: z.string().min(1).max(32),
});
export class LinkedAccountPathParamsDto extends createZodDto(
  linkedAccountPathParamsSchema,
) {}

/**
 * The Workspace a bell belongs to. A Notification does carry one, unlike a Linked Account: a
 * Member of several reads one Workspace's bell at a time and nothing from the others.
 *
 * There is no person here, and there is no route that adds one. That is what makes "nobody sees
 * anybody else's" a property of this surface rather than a check somebody has to remember: the
 * recipient is always the session's Account, so no request has a shape that names another.
 */
export const workspacePathParamsSchema = z.object({
  workspaceId: z.uuid(),
});
export class WorkspacePathParamsDto extends createZodDto(
  workspacePathParamsSchema,
) {}

/** The same path, plus the one Notification a route acts on. */
export const notificationPathParamsSchema = z.object({
  workspaceId: z.uuid(),
  id: z.uuid(),
});
export class NotificationPathParamsDto extends createZodDto(
  notificationPathParamsSchema,
) {}
