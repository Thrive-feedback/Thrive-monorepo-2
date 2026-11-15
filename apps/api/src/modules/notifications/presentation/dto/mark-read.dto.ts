import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NOTIFICATION_TYPES } from '../../domain/value-object/notification-type.vo';

/**
 * What to mark read. Sent with nothing, every kind — the bell's Mark all as read. Sent with
 * `types`, only those kinds: what opening the page they lead to reads.
 */
export const markReadRequestSchema = z
  .strictObject({
    types: z.array(z.enum(NOTIFICATION_TYPES)).min(1).optional(),
  })
  // No body at all is how Mark all as read has always been sent, and still means every kind.
  .default({});
export class MarkReadRequestDto extends createZodDto(markReadRequestSchema) {}
