import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { SEEN_LISTS } from '../../domain/value-object/seen-list.vo';

export const markListSeenRequestSchema = z.strictObject({
  /** The list the caller opened. Received's All is not one: it marks none of its kinds. */
  list: z.enum(SEEN_LISTS),
});
export class MarkListSeenRequestDto extends createZodDto(
  markListSeenRequestSchema,
) {}
