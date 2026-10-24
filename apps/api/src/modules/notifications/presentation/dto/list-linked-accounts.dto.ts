import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CHAT_PROVIDERS } from '../../domain/value-object/chat-provider.vo';

/**
 * One linked chat account, as the Member's own Settings shows it. The chat tool's ids are
 * deliberately absent: the screen needs the name they go by there, and nothing else.
 */
const linkedAccountSchema = z.object({
  provider: z.enum(CHAT_PROVIDERS),
  externalUsername: z.string(),
  linkedAt: z.iso.datetime(),
});

export const listLinkedAccountsResponseSchema = z.object({
  items: z.array(linkedAccountSchema),
});
export class ListLinkedAccountsResponseDto extends createZodDto(
  listLinkedAccountsResponseSchema,
) {}
