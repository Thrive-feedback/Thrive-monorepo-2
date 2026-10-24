import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CHAT_PROVIDERS } from '../../domain/value-object/chat-provider.vo';

export const beginAccountLinkResponseSchema = z.object({
  /**
   * Where to send the Member's browser to authorise. It carries the signed `state` this link is
   * recognised by on the way back, bound to the Account and the tool that started it.
   */
  authorizeUrl: z.url(),
});
export class BeginAccountLinkResponseDto extends createZodDto(
  beginAccountLinkResponseSchema,
) {}

/**
 * What the chat tool handed the Member's browser on the way back. Capped because both are
 * values from outside; neither is read for anything but the exchange and the signature check.
 */
export const completeAccountLinkRequestSchema = z.strictObject({
  code: z.string().min(1).max(512),
  state: z.string().min(1).max(2048),
});
export class CompleteAccountLinkRequestDto extends createZodDto(
  completeAccountLinkRequestSchema,
) {}

export const completeAccountLinkResponseSchema = z.object({
  provider: z.enum(CHAT_PROVIDERS),
  /** The name to show back, so the Member can see which account Thrive now has. */
  externalUsername: z.string(),
});
export class CompleteAccountLinkResponseDto extends createZodDto(
  completeAccountLinkResponseSchema,
) {}
