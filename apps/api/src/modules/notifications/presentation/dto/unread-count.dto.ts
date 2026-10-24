import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * What the bell's badge draws: a number, and nothing that would let it be reconstructed into
 * who told whom what. It is the one response the web asks for on a timer, so it is deliberately
 * the smallest body in the module.
 */
export const unreadCountResponseSchema = z.object({
  count: z.number().int(),
});
export class UnreadCountResponseDto extends createZodDto(
  unreadCountResponseSchema,
) {}
