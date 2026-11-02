import {
  cursorQueryShape,
  cursorResultShape,
} from '@app/shared/presentation/dto/page.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { personalItemSchema } from './list-received-items.dto';

export const listGivenItemsQuerySchema = z.strictObject(cursorQueryShape);
export class ListGivenItemsQueryDto extends createZodDto(
  listGivenItemsQuerySchema,
) {}

export const listGivenItemsResponseSchema = z.object({
  /** Whose list this is, so a reader can tell themselves among the people a piece names. */
  readerAccountId: z.uuid(),
  /**
   * What the caller wrote, newest first. Whose it is is never a query parameter. An Ask `ANSWERED`
   * with no `answer` was answered in words the caller may not read.
   */
  items: z.array(personalItemSchema),
  ...cursorResultShape,
});
export class ListGivenItemsResponseDto extends createZodDto(
  listGivenItemsResponseSchema,
) {}
