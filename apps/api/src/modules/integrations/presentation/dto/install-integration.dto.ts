import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const beginInstallResponseSchema = z.object({
  /**
   * Where to send the Admin's browser to authorise Thrive. It carries the signed `state` this
   * install is recognised by on the way back.
   */
  authorizeUrl: z.url(),
});
export class BeginInstallResponseDto extends createZodDto(
  beginInstallResponseSchema,
) {}

/**
 * What the chat tool handed the Admin's browser on the way back. Capped because both are
 * values from outside; neither is read for anything but the exchange and the signature check.
 */
export const completeInstallRequestSchema = z.strictObject({
  code: z.string().min(1).max(512),
  state: z.string().min(1).max(2048),
});
export class CompleteInstallRequestDto extends createZodDto(
  completeInstallRequestSchema,
) {}

const offeredChannelSchema = z.object({
  /** The tool's own id for the channel, opaque and chosen from this list, never typed in. */
  id: z.string(),
  name: z.string(),
});

export const completeInstallResponseSchema = z.object({
  /** The tool's own name for the space authorised — a Discord server, a Slack team. */
  externalWorkspaceName: z.string(),
  /** The text channels the Admin may choose between. Voice channels and categories are absent. */
  channels: z.array(offeredChannelSchema),
  /**
   * Thrive's signed statement of which space was authorised, carried back when the channel is
   * chosen. Nothing about that is read from a request body: this is Thrive's own answer
   * returning to it.
   */
  installation: z.string(),
});
export class CompleteInstallResponseDto extends createZodDto(
  completeInstallResponseSchema,
) {}

export const chooseChannelRequestSchema = z.strictObject({
  installation: z.string().min(1).max(2048),
  /** One of the channels offered; anything else is refused against that list. */
  channelId: z.string().min(1).max(64),
});
export class ChooseChannelRequestDto extends createZodDto(
  chooseChannelRequestSchema,
) {}
