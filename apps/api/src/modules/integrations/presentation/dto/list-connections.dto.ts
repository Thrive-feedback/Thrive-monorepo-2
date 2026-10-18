import {
  pageQueryShape,
  pageResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { INTEGRATION_PROVIDERS } from '../../domain/value-object/integration-provider.vo';

export const listConnectionsQuerySchema = z.strictObject(pageQueryShape);
export class ListConnectionsQueryDto extends createZodDto(
  listConnectionsQuerySchema,
) {}

/**
 * One Connection of this Workspace. The tool's own ids are absent: the screen shows names, and
 * an id nothing reads is an id nothing can leak.
 */
const connectionSchema = z.object({
  provider: z.enum(INTEGRATION_PROVIDERS),
  externalWorkspaceName: z.string(),
  externalChannelName: z.string(),
  /** The Admin who connected it, whom the screen puts a name to. */
  connectedByAccountId: z.uuid(),
  connectedAt: z.iso.datetime({ offset: true }),
});

export const listConnectionsResponseSchema = z.object({
  /** At most one per chat tool, so today at most one altogether. */
  items: z.array(connectionSchema),
  ...pageResultShape,
});
export class ListConnectionsResponseDto extends createZodDto(
  listConnectionsResponseSchema,
) {}
