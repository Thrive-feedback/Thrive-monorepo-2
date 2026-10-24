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
